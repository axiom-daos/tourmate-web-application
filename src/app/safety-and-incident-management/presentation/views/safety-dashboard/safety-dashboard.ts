import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SafetyMonitoringStore } from '../../../application/safety-monitoring.store';
import { IncidentStore } from '../../../application/incident.store';
import { Incident } from '../../../domain/model/aggregates/incident.entity';
import {
  LocationReport,
  SafetyAlert,
  TelemetryRecord,
  WearableRecord,
} from '../../../domain/model/safety-records';

@Component({
  selector: 'app-safety-dashboard',
  standalone: true,
  imports: [DatePipe, FormsModule, LowerCasePipe, RouterLink, TranslatePipe],
  templateUrl: './safety-dashboard.html',
  styleUrl: './safety-dashboard.css',
})
export class SafetyDashboard {
  protected readonly store = inject(SafetyMonitoringStore);
  protected readonly incidentStore = inject(IncidentStore);
  protected readonly selectedIncidentId = signal<number | null>(null);
  protected editingIncidentLocation = false;
  protected readonly selectedIncident = computed(() => {
    const incidents = this.incidentStore.incidents();
    return (
      incidents.find((incident) => incident.id === this.selectedIncidentId()) ??
      incidents[0] ??
      null
    );
  });
  protected readonly incidentLocations = computed(() => {
    const incident = this.selectedIncident();
    if (!incident) return [];
    const linked = this.store.locations().filter((location) =>
      this.belongsToIncident(location, incident),
    );
    return [
      {
        id: `incident-location-${incident.id}`,
        incidentId: incident.id,
        expeditionId: incident.activeTourId,
        touristId: incident.reportedByUserId,
        latitude: incident.latitude,
        longitude: incident.longitude,
        recordedAt: incident.reportedAt,
        isIncidentLocation: true,
      },
      ...linked.map((location) => ({ ...location, isIncidentLocation: false })),
    ];
  });
  protected readonly incidentTelemetry = computed(() => {
    const incident = this.selectedIncident();
    return incident
      ? this.store.telemetry().filter((record) => this.belongsToIncident(record, incident))
      : [];
  });
  protected readonly incidentWearables = computed(() => {
    const incident = this.selectedIncident();
    return incident
      ? this.store.wearables().filter((record) => this.belongsToIncident(record, incident))
      : [];
  });
  protected readonly incidentAlerts = computed(() => {
    const incident = this.selectedIncident();
    return incident
      ? this.store
          .allAlerts()
          .filter(
            (alert) =>
              String(alert.sourceRecordId) === String(incident.id) ||
              this.belongsToIncident(alert, incident),
          )
      : [];
  });
  protected readonly activeIncidentAlertCount = computed(
    () => this.incidentAlerts().filter((alert) => alert.status === 'ACTIVE').length,
  );

  protected location = {
    id: null as string | number | null,
    latitude: 0,
    longitude: 0,
    expectedLatitude: null as number | null,
    expectedLongitude: null as number | null,
  };

  protected wearable = {
    id: null as string | number | null,
    deviceId: '',
    batteryLevel: 100,
    connectivity: 'CONNECTED' as 'CONNECTED' | 'DISCONNECTED',
    lastSyncAt: null as string | null,
  };

  protected telemetry = {
    id: null as string | number | null,
    wearableId: '',
    heartRate: 70,
    bloodOxygen: 98,
    batteryLevel: 100,
    connectivity: 'CONNECTED' as 'CONNECTED' | 'DISCONNECTED',
  };

  protected selectIncident(id: number | string | null): void {
    this.selectedIncidentId.set(id === null ? null : Number(id));
    this.resetForms();
  }

  protected submitLocation(): void {
    const incident = this.selectedIncident();
    if (!incident) return;
    if (this.editingIncidentLocation) {
      this.incidentStore.updateIncident(
        new Incident({
          id: incident.id,
          uuid: incident.uuid,
          activeTourId: incident.activeTourId,
          reportedByUserId: incident.reportedByUserId,
          description: incident.description,
          latitude: Number(this.location.latitude),
          longitude: Number(this.location.longitude),
          reportedAt: incident.reportedAt,
          status: incident.status,
          severity: incident.severity,
          isSynced: incident.isSynced,
          resolutionNote: incident.resolutionNote,
          reporterRole: incident.reporterRole,
        }),
      );
      this.editingIncidentLocation = false;
      return;
    }
    const report = {
      incidentId: incident.id,
      expeditionId: incident.activeTourId,
      touristId: incident.reportedByUserId,
      latitude: Number(this.location.latitude),
      longitude: Number(this.location.longitude),
      recordedAt: new Date().toISOString(),
    };
    if (
      this.location.expectedLatitude !== null &&
      this.location.expectedLongitude !== null
    ) {
      Object.assign(report, {
        expectedLatitude: Number(this.location.expectedLatitude),
        expectedLongitude: Number(this.location.expectedLongitude),
      });
    }
    if (this.location.id !== null) {
      this.store.updateLocation({
        ...report,
        id: this.location.id,
      });
    } else {
      this.store.reportLocation(report);
    }
    this.location.id = null;
    this.editingIncidentLocation = false;
  }

  protected editLocation(location: LocationReport & { isIncidentLocation?: boolean }): void {
    this.location = {
      id: location.isIncidentLocation ? null : location.id,
      latitude: location.latitude,
      longitude: location.longitude,
      expectedLatitude: location.expectedLatitude ?? null,
      expectedLongitude: location.expectedLongitude ?? null,
    };
    this.editingIncidentLocation = Boolean(location.isIncidentLocation);
  }

  protected linkWearable(): void {
    const incident = this.selectedIncident();
    if (!incident) return;
    this.store.linkWearable({
      deviceId: this.wearable.deviceId,
      incidentId: incident.id,
      touristId: incident.reportedByUserId,
      activeExpeditionId: incident.activeTourId,
      batteryLevel: Number(this.wearable.batteryLevel),
      connectivity: this.wearable.connectivity,
      ...(this.wearable.lastSyncAt ? { lastSyncAt: this.wearable.lastSyncAt } : {}),
      ...(this.wearable.id !== null ? { id: this.wearable.id } : {}),
    });
    this.wearable.id = null;
  }

  protected submitTelemetry(): void {
    const incident = this.selectedIncident();
    if (!incident) return;
    const record = {
      incidentId: incident.id,
      expeditionId: incident.activeTourId,
      touristId: incident.reportedByUserId,
      wearableId: this.telemetry.wearableId,
      heartRate: Number(this.telemetry.heartRate),
      bloodOxygen: Number(this.telemetry.bloodOxygen),
      batteryLevel: Number(this.telemetry.batteryLevel),
      connectivity: this.telemetry.connectivity,
      recordedAt: new Date().toISOString(),
    };
    if (this.telemetry.id !== null) {
      this.store.updateTelemetry({ ...record, id: this.telemetry.id });
    } else {
      this.store.ingestTelemetry(record);
    }
    this.telemetry.id = null;
  }

  protected editTelemetry(record: TelemetryRecord): void {
    this.telemetry = {
      id: record.id,
      wearableId: record.wearableId,
      heartRate: record.heartRate,
      bloodOxygen: record.bloodOxygen,
      batteryLevel: record.batteryLevel,
      connectivity: record.connectivity,
    };
  }

  protected editWearable(record: WearableRecord): void {
    this.wearable = {
      id: record.id,
      deviceId: record.deviceId,
      batteryLevel: record.batteryLevel,
      connectivity: record.connectivity,
      lastSyncAt: record.lastSyncAt,
    };
  }

  protected acknowledge(alert: SafetyAlert): void {
    this.store.acknowledgeAlert(alert);
  }

  protected unlink(wearable: WearableRecord): void {
    this.store.unlinkWearable(wearable);
  }

  protected exportReport(): void {
    const expeditionId = this.selectedIncident()?.activeTourId;
    if (!Number.isInteger(expeditionId) || expeditionId <= 0) return;

    const blob = new Blob(
      [`\uFEFF${this.store.exportExpeditionReport(expeditionId)}`],
      { type: 'text/csv;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expedition-${expeditionId}-safety-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private belongsToIncident(
    record: {
      incidentId?: number;
      expeditionId?: number;
      activeExpeditionId?: number | null;
      touristId: number;
    },
    incident: Incident,
  ): boolean {
    if (record.incidentId !== undefined) {
      return Number(record.incidentId) === incident.id;
    }
    const expeditionId = record.expeditionId ?? record.activeExpeditionId;
    return (
      (expeditionId == null || Number(expeditionId) === incident.activeTourId) &&
      Number(record.touristId) === incident.reportedByUserId
    );
  }

  private resetForms(): void {
    const incident = this.selectedIncident();
    this.editingIncidentLocation = false;
    this.location = {
      id: null,
      latitude: incident?.latitude ?? 0,
      longitude: incident?.longitude ?? 0,
      expectedLatitude: null,
      expectedLongitude: null,
    };
    this.wearable = {
      id: null,
      deviceId: '',
      batteryLevel: 100,
      connectivity: 'CONNECTED',
      lastSyncAt: null,
    };
    this.telemetry = {
      id: null,
      wearableId: '',
      heartRate: 70,
      bloodOxygen: 98,
      batteryLevel: 100,
      connectivity: 'CONNECTED',
    };
  }
}
