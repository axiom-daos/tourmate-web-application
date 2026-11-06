import { computed, inject, Injectable, signal } from '@angular/core';
import { IncidentStore } from './incident.store';
import { Incident } from '../domain/model/aggregates/incident.entity';
import { IncidentStatus } from '../domain/model/value-object/incident-status';
import {
  LocationReport,
  NewSafetyAlert,
  NewTelemetryRecord,
  NewWearableRecord,
  SafetyAlert,
  SafetyAlertType,
  TelemetryRecord,
  WearableRecord,
} from '../domain/model/safety-records';
import { SafetyMonitoringApi } from '../infrastructure/safety-monitoring-api';

const ROUTE_DEVIATION_THRESHOLD_METERS = 500;
const COMMUNICATION_TIMEOUT_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SafetyMonitoringStore {
  private readonly api = inject(SafetyMonitoringApi);
  private readonly incidentStore = inject(IncidentStore);

  private readonly locationsSignal = signal<LocationReport[]>([]);
  private readonly alertsSignal = signal<SafetyAlert[]>([]);
  private readonly telemetrySignal = signal<TelemetryRecord[]>([]);
  private readonly wearablesSignal = signal<WearableRecord[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly locations = this.locationsSignal.asReadonly();
  readonly alerts = this.alertsSignal.asReadonly();
  readonly telemetry = this.telemetrySignal.asReadonly();
  readonly wearables = this.wearablesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly allAlerts = computed<SafetyAlert[]>(() => [
    ...this.alertsSignal(),
    ...this.incidentStore
      .incidents()
      .map((incident) => ({
        id: `incident-${incident.id}`,
        incidentId: incident.id,
        expeditionId: incident.activeTourId,
        touristId: incident.reportedByUserId,
        type: 'INCIDENT' as const,
        severity: incident.severity,
        message: incident.description,
        createdAt: incident.reportedAt,
        status:
          incident.status === IncidentStatus.IN_REVIEW
            ? ('ACKNOWLEDGED' as const)
            : incident.status === IncidentStatus.RESOLVED ||
                incident.status === IncidentStatus.CLOSED
              ? ('RESOLVED' as const)
              : ('ACTIVE' as const),
        sourceRecordId: incident.id,
      })),
  ]);

  readonly activeAlerts = computed(() =>
    this.allAlerts().filter((alert) => alert.status === 'ACTIVE'),
  );

  readonly latestTelemetry = computed(() => {
    const latestByParticipant = new Map<string, TelemetryRecord>();
    for (const record of [...this.telemetrySignal()].sort(
      (left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt),
    )) {
      const key = `${record.expeditionId}:${record.touristId}`;
      if (!latestByParticipant.has(key)) latestByParticipant.set(key, record);
    }
    return [...latestByParticipant.values()];
  });

  readonly latestLocations = computed(() => {
    const latestByParticipant = new Map<string, LocationReport>();
    for (const location of [...this.locationsSignal()].sort(
      (left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt),
    )) {
      const key = `${location.expeditionId}:${location.touristId}`;
      if (!latestByParticipant.has(key)) latestByParticipant.set(key, location);
    }
    return [...latestByParticipant.values()];
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getSafetyData().subscribe({
      next: ({ locations, alerts, telemetry, wearables }) => {
        this.locationsSignal.set(locations);
        this.alertsSignal.set(alerts);
        this.telemetrySignal.set(telemetry);
        this.wearablesSignal.set(wearables);
        this.loadingSignal.set(false);
        this.evaluateCommunicationAlerts();
      },
      error: (error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set('incidents.safety.data_load_error');
        console.error('Error loading safety monitoring data', error);
      },
    });
  }

  reportLocation(location: Omit<LocationReport, 'id'>): void {
    if (
      !Number.isInteger(location.expeditionId) ||
      location.expeditionId <= 0 ||
      !Number.isInteger(location.touristId) ||
      location.touristId <= 0 ||
      !this.isValidCoordinates(location.latitude, location.longitude) ||
      ((location.expectedLatitude !== undefined || location.expectedLongitude !== undefined) &&
        (location.expectedLatitude === undefined ||
          location.expectedLongitude === undefined ||
          !this.isValidCoordinates(location.expectedLatitude, location.expectedLongitude))) ||
      !Number.isFinite(Date.parse(location.recordedAt))
    ) {
      this.errorSignal.set('incidents.safety.invalid_location');
      return;
    }

    this.api.createLocation(location).subscribe({
      next: (created) => {
        this.locationsSignal.update((locations) => [created, ...locations]);
        this.errorSignal.set(null);
        if (
          location.expectedLatitude !== undefined &&
          location.expectedLongitude !== undefined &&
          this.distanceInMeters(
            location.latitude,
            location.longitude,
            location.expectedLatitude,
            location.expectedLongitude,
          ) > ROUTE_DEVIATION_THRESHOLD_METERS
        ) {
          this.createSafetyAlert({
            ...(created.incidentId !== undefined
              ? { incidentId: created.incidentId }
              : {}),
            expeditionId: location.expeditionId,
            touristId: location.touristId,
            type: 'ROUTE_DEVIATION',
            severity: 'HIGH',
            message: 'incidents.safety.alert_messages.route_deviation',
            createdAt: new Date().toISOString(),
            status: 'ACTIVE',
            sourceRecordId: created.id,
          });
        }
      },
      error: (error) => {
        this.errorSignal.set('incidents.safety.location_save_error');
        console.error('Error saving location report', error);
      },
    });
  }

  updateLocation(location: LocationReport): void {
    if (
      !Number.isInteger(location.expeditionId) ||
      location.expeditionId <= 0 ||
      !Number.isInteger(location.touristId) ||
      location.touristId <= 0 ||
      !this.isValidCoordinates(location.latitude, location.longitude) ||
      ((location.expectedLatitude !== undefined || location.expectedLongitude !== undefined) &&
        (location.expectedLatitude === undefined ||
          location.expectedLongitude === undefined ||
          !this.isValidCoordinates(location.expectedLatitude, location.expectedLongitude))) ||
      !Number.isFinite(Date.parse(location.recordedAt))
    ) {
      this.errorSignal.set('incidents.safety.invalid_location');
      return;
    }

    this.api.updateLocation(location).subscribe({
      next: (saved) => {
        this.locationsSignal.update((locations) =>
          locations.map((item) =>
            String(item.id) === String(saved.id) ? saved : item,
          ),
        );
        this.errorSignal.set(null);
      },
      error: (error) => {
        this.errorSignal.set('incidents.safety.location_save_error');
        console.error('Error updating location report', error);
      },
    });
  }

  ingestTelemetry(record: Omit<TelemetryRecord, 'id'>): void {
    const wearable = this.wearablesSignal().find(
      (item) =>
        item.deviceId === record.wearableId &&
        Number(item.touristId) === Number(record.touristId) &&
        (item.activeExpeditionId == null ||
          Number(item.activeExpeditionId) === Number(record.expeditionId)),
    );
    if (!wearable) {
      this.errorSignal.set('incidents.safety.wearable_not_registered');
      return;
    }
    if (!this.isValidTelemetry(record)) {
      this.errorSignal.set('incidents.safety.invalid_telemetry');
      return;
    }

    this.api.createTelemetry(record).subscribe({
      next: (created) => {
        this.telemetrySignal.update((records) => [created, ...records]);
        this.errorSignal.set(null);
        const criticalVital =
          created.heartRate >= 120 ||
          created.heartRate <= 40 ||
          created.bloodOxygen < 90;
        if (criticalVital) {
          this.createSafetyAlert({
            ...(created.incidentId !== undefined
              ? { incidentId: created.incidentId }
              : {}),
            expeditionId: created.expeditionId,
            touristId: created.touristId,
            type: 'HEALTH_CRITICAL',
            severity: 'CRITICAL',
            message: 'incidents.safety.alert_messages.health_critical',
            createdAt: new Date().toISOString(),
            status: 'ACTIVE',
            sourceRecordId: created.id,
          });
        }
        if (created.connectivity === 'DISCONNECTED') {
          this.createSafetyAlert({
            ...(created.incidentId !== undefined
              ? { incidentId: created.incidentId }
              : {}),
            expeditionId: created.expeditionId,
            touristId: created.touristId,
            type: 'COMMUNICATION_LOST',
            severity: 'HIGH',
            message: 'incidents.safety.alert_messages.communication_lost',
            createdAt: new Date().toISOString(),
            status: 'ACTIVE',
            sourceRecordId: created.id,
          });
        }
        const updatedWearable = {
          ...wearable,
          batteryLevel: created.batteryLevel,
          connectivity: created.connectivity,
          lastSyncAt: created.recordedAt,
        };
        this.api.updateWearable(updatedWearable).subscribe({
          next: (saved) =>
            this.wearablesSignal.update((wearables) =>
              wearables.map((item) =>
                String(item.id) === String(saved.id) ? saved : item,
              ),
            ),
          error: (error) => {
            this.errorSignal.set('incidents.safety.wearable_status_save_error');
            console.error('Error updating wearable status', error);
          },
        });
      },
      error: (error) => {
        this.errorSignal.set('incidents.safety.telemetry_save_error');
        console.error('Error ingesting wearable telemetry', error);
      },
    });
  }

  updateTelemetry(record: TelemetryRecord): void {
    if (!this.isValidTelemetry(record)) {
      this.errorSignal.set('incidents.safety.invalid_telemetry');
      return;
    }

    this.api.updateTelemetry(record).subscribe({
      next: (saved) => {
        this.telemetrySignal.update((records) =>
          records.map((item) =>
            String(item.id) === String(saved.id) ? saved : item,
          ),
        );
        this.errorSignal.set(null);
      },
      error: (error) => {
        this.errorSignal.set('incidents.safety.telemetry_save_error');
        console.error('Error updating wearable telemetry', error);
      },
    });
  }

  linkWearable(
    wearable: Omit<NewWearableRecord, 'batteryLevel' | 'connectivity' | 'lastSyncAt'> &
      Partial<Pick<WearableRecord, 'batteryLevel' | 'connectivity' | 'lastSyncAt'>> & {
        id?: string | number;
      },
  ): void {
    const deviceId = wearable.deviceId.trim();
    if (!deviceId || !Number.isInteger(wearable.touristId) || wearable.touristId <= 0) {
      this.errorSignal.set('incidents.safety.invalid_wearable');
      return;
    }
    if (
      this.wearablesSignal().some(
        (item) =>
          item.deviceId === deviceId &&
          String(item.id) !== String(wearable.id ?? ''),
      )
    ) {
      this.errorSignal.set('incidents.safety.wearable_already_linked');
      return;
    }

    const payload = {
      ...wearable,
      deviceId,
      batteryLevel: wearable.batteryLevel ?? 100,
      connectivity: wearable.connectivity ?? ('CONNECTED' as const),
      lastSyncAt: wearable.lastSyncAt ?? new Date().toISOString(),
    };
    const request = wearable.id
      ? this.api.updateWearable({ ...payload, id: wearable.id })
      : this.api.createWearable(payload);
    request.subscribe({
      next: (created) => {
        this.wearablesSignal.update((items) =>
          wearable.id
            ? items.map((item) =>
                String(item.id) === String(created.id) ? created : item,
              )
            : [created, ...items],
        );
        this.errorSignal.set(null);
      },
      error: (error) => {
        this.errorSignal.set('incidents.safety.wearable_link_error');
        console.error('Error linking wearable', error);
      },
    });
  }

  unlinkWearable(wearable: WearableRecord): void {
    if (wearable.activeExpeditionId != null) {
      this.errorSignal.set('incidents.safety.wearable_active_expedition');
      return;
    }
    this.api.deleteWearable(wearable.id).subscribe({
      next: () => {
        this.wearablesSignal.update((items) =>
          items.filter((item) => String(item.id) !== String(wearable.id)),
        );
        this.errorSignal.set(null);
      },
      error: (error) => {
        this.errorSignal.set('incidents.safety.wearable_unlink_error');
        console.error('Error unlinking wearable', error);
      },
    });
  }

  acknowledgeAlert(alert: SafetyAlert): void {
    if (alert.type === 'INCIDENT') {
      const incident = this.incidentStore
        .incidents()
        .find((item) => String(item.id) === String(alert.sourceRecordId));
      if (!incident) return;
      this.incidentStore.updateIncident(
        new Incident({
          id: incident.id,
          uuid: incident.uuid,
          activeTourId: incident.activeTourId,
          reportedByUserId: incident.reportedByUserId,
          description: incident.description,
          latitude: incident.latitude,
          longitude: incident.longitude,
          reportedAt: incident.reportedAt,
          status: IncidentStatus.IN_REVIEW,
          severity: incident.severity,
          isSynced: incident.isSynced,
          resolutionNote: incident.resolutionNote,
          reporterRole: incident.reporterRole,
        }),
      );
      return;
    }

    const updated = { ...alert, status: 'ACKNOWLEDGED' as const };
    this.api.updateAlert(updated).subscribe({
      next: (saved) => {
        this.alertsSignal.update((alerts) =>
          alerts.map((item) => (String(item.id) === String(saved.id) ? saved : item)),
        );
        this.errorSignal.set(null);
      },
      error: (error) => {
        this.errorSignal.set('incidents.safety.alert_update_error');
        console.error('Error acknowledging safety alert', error);
      },
    });
  }

  exportExpeditionReport(expeditionId: number): string {
    const rows: unknown[][] = [
      ['recordType', 'recordId', 'expeditionId', 'touristId', 'recordedAt', 'details'],
      ...this.locationsSignal()
        .filter((record) => record.expeditionId === expeditionId)
        .map((record) => [
          'location',
          record.id,
          record.expeditionId,
          record.touristId,
          record.recordedAt,
          `${record.latitude},${record.longitude}`,
        ]),
      ...this.telemetrySignal()
        .filter((record) => record.expeditionId === expeditionId)
        .map((record) => [
          'telemetry',
          record.id,
          record.expeditionId,
          record.touristId,
          record.recordedAt,
          `heartRate=${record.heartRate}; bloodOxygen=${record.bloodOxygen}; battery=${record.batteryLevel}; connectivity=${record.connectivity}`,
        ]),
      ...this.alertsSignal()
        .filter((record) => record.expeditionId === expeditionId)
        .map((record) => [
          'alert',
          record.id,
          record.expeditionId,
          record.touristId,
          record.createdAt,
          `${record.type}; ${record.severity}; ${record.status}; ${record.message}`,
        ]),
      ...this.incidentStore
        .incidents()
        .filter((record) => record.activeTourId === expeditionId)
        .map((record) => [
          'incident',
          record.id,
          record.activeTourId,
          record.reportedByUserId,
          record.reportedAt,
          `${record.status}; ${record.severity}; ${record.description}`,
        ]),
    ];
    return rows.map((row) => row.map((field) => this.escapeCsv(field)).join(',')).join('\r\n');
  }

  private createSafetyAlert(alert: NewSafetyAlert): void {
    const duplicate = this.alertsSignal().some(
      (item) =>
        item.status === 'ACTIVE' &&
        String(item.incidentId ?? '') === String(alert.incidentId ?? '') &&
        item.expeditionId === alert.expeditionId &&
        item.touristId === alert.touristId &&
        item.type === alert.type,
    );
    if (duplicate) return;

    this.api.createAlert(alert).subscribe({
      next: (created) => this.alertsSignal.update((items) => [created, ...items]),
      error: (error) => {
        this.errorSignal.set('incidents.safety.alert_create_error');
        console.error('Error creating safety alert', error);
      },
    });
  }

  private evaluateCommunicationAlerts(): void {
    const now = Date.now();
    for (const wearable of this.wearablesSignal()) {
      const lastSync = Date.parse(wearable.lastSyncAt);
      const hasLostCommunication =
        wearable.connectivity === 'DISCONNECTED' ||
        (Number.isFinite(lastSync) && now - lastSync > COMMUNICATION_TIMEOUT_MS);
      if (!hasLostCommunication || wearable.activeExpeditionId == null) continue;
      const relatedIncident = this.incidentStore
        .incidents()
        .find(
          (incident) =>
            incident.activeTourId === wearable.activeExpeditionId &&
            incident.reportedByUserId === wearable.touristId,
        );

      this.createSafetyAlert({
        ...(relatedIncident ? { incidentId: relatedIncident.id } : {}),
        expeditionId: wearable.activeExpeditionId,
        touristId: wearable.touristId,
        type: 'COMMUNICATION_LOST',
        severity: 'HIGH',
        message: 'incidents.safety.alert_messages.communication_lost',
        createdAt: new Date().toISOString(),
        status: 'ACTIVE',
      });
    }
  }

  private isValidTelemetry(record: Omit<TelemetryRecord, 'id'>): boolean {
    return (
      Number.isInteger(record.expeditionId) &&
      record.expeditionId > 0 &&
      Number.isInteger(record.touristId) &&
      record.touristId > 0 &&
      Number.isFinite(record.heartRate) &&
      record.heartRate >= 25 &&
      record.heartRate <= 240 &&
      Number.isFinite(record.bloodOxygen) &&
      record.bloodOxygen >= 50 &&
      record.bloodOxygen <= 100 &&
      Number.isFinite(record.batteryLevel) &&
      record.batteryLevel >= 0 &&
      record.batteryLevel <= 100 &&
      Number.isFinite(Date.parse(record.recordedAt))
    );
  }

  private isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      Number.isFinite(latitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      Number.isFinite(longitude) &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  private distanceInMeters(
    latitudeA: number,
    longitudeA: number,
    latitudeB: number,
    longitudeB: number,
  ): number {
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const latitudeDelta = radians(latitudeB - latitudeA);
    const longitudeDelta = radians(longitudeB - longitudeA);
    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(radians(latitudeA)) *
        Math.cos(radians(latitudeB)) *
        Math.sin(longitudeDelta / 2) ** 2;
    return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private escapeCsv(value: unknown): string {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }
}
