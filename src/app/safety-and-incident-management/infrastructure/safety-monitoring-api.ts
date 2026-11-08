import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LocationReport,
  NewLocationReport,
  NewSafetyAlert,
  NewTelemetryRecord,
  NewWearableRecord,
  SafetyAlert,
  TelemetryRecord,
  WearableRecord,
} from '../domain/model/safety-records';

type SafetyRecordField = 'alerts' | 'telemetry' | 'wearables';

interface MockApiLocation {
  id: string | number;
  incidentId?: number;
  expeditionId?: number;
  touristId?: number;
  latitude?: string | number;
  longitude?: string | number;
  recordedAt?: string;
  expectedLatitude?: string | number;
  expectedLongitude?: string | number;
  alerts?: string;
  telemetry?: string;
  wearables?: string;
}

interface SafetyMonitoringData {
  locations: LocationReport[];
  alerts: SafetyAlert[];
  telemetry: TelemetryRecord[];
  wearables: WearableRecord[];
}

@Injectable({ providedIn: 'root' })
export class SafetyMonitoringApi {
  private readonly http = inject(HttpClient);
  private readonly locationsUrl = `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/locations`;

  getSafetyData(): Observable<SafetyMonitoringData> {
    return this.http.get<MockApiLocation[]>(this.locationsUrl).pipe(
      map((rows) => ({
        locations: rows
          .map((row) => this.mapLocation(row))
          .filter((location): location is LocationReport => location !== null),
        alerts: this.readStoredRecords<SafetyAlert>(rows, 'alerts'),
        telemetry: this.readStoredRecords<TelemetryRecord>(rows, 'telemetry'),
        wearables: this.readStoredRecords<WearableRecord>(rows, 'wearables'),
      })),
    );
  }

  createLocation(location: NewLocationReport): Observable<LocationReport> {
    return this.http
      .post<MockApiLocation>(this.locationsUrl, {
        ...location,
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        expectedLatitude:
          location.expectedLatitude === undefined
            ? ''
            : String(location.expectedLatitude),
        expectedLongitude:
          location.expectedLongitude === undefined
            ? ''
            : String(location.expectedLongitude),
        alerts: '',
        telemetry: '',
        wearables: '',
      })
      .pipe(map((created) => this.mapLocation(created)))
      .pipe(
        map((created) => {
          if (!created) throw new Error('MockAPI returned an invalid location record');
          return created;
        }),
      );
  }

  updateLocation(location: LocationReport): Observable<LocationReport> {
    const { id, ...locationData } = location;
    return this.http.get<MockApiLocation>(`${this.locationsUrl}/${id}`).pipe(
      switchMap(({ id: _rowId, ...existing }) =>
        this.http
          .put<MockApiLocation>(`${this.locationsUrl}/${id}`, {
            ...existing,
            ...locationData,
            latitude: String(location.latitude),
            longitude: String(location.longitude),
            expectedLatitude:
              location.expectedLatitude === undefined
                ? ''
                : String(location.expectedLatitude),
            expectedLongitude:
              location.expectedLongitude === undefined
                ? ''
                : String(location.expectedLongitude),
          })
          .pipe(map((saved) => this.mapLocation(saved))),
      ),
      map((saved) => {
        if (!saved) throw new Error('MockAPI returned an invalid location record');
        return saved;
      }),
    );
  }

  createAlert(alert: NewSafetyAlert): Observable<SafetyAlert> {
    return this.createStoredRecord('alerts', alert);
  }

  updateAlert(alert: SafetyAlert): Observable<SafetyAlert> {
    return this.updateStoredRecord('alerts', alert);
  }

  createTelemetry(record: NewTelemetryRecord): Observable<TelemetryRecord> {
    return this.createStoredRecord('telemetry', record);
  }

  updateTelemetry(record: TelemetryRecord): Observable<TelemetryRecord> {
    return this.updateStoredRecord('telemetry', record);
  }

  createWearable(wearable: NewWearableRecord): Observable<WearableRecord> {
    return this.createStoredRecord('wearables', wearable);
  }

  updateWearable(wearable: WearableRecord): Observable<WearableRecord> {
    return this.updateStoredRecord('wearables', wearable);
  }

  deleteWearable(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.locationsUrl}/${id}`);
  }

  private createStoredRecord<T extends { id: string | number }>(
    field: SafetyRecordField,
    record: Omit<T, 'id'>,
  ): Observable<T> {
    return this.http
      .post<MockApiLocation>(this.locationsUrl, this.createStorageRow(field, record))
      .pipe(map((row) => this.parseStoredRecord<T>(row, field)!));
  }

  private updateStoredRecord<T extends { id: string | number }>(
    field: SafetyRecordField,
    record: T,
  ): Observable<T> {
    const id = record.id;
    return this.http.get<MockApiLocation>(`${this.locationsUrl}/${id}`).pipe(
      switchMap((row) => {
        const payload = {
          ...row,
          [field]: JSON.stringify(record),
        };
        delete (payload as Partial<MockApiLocation>).id;
        return this.http
          .put<MockApiLocation>(`${this.locationsUrl}/${id}`, payload)
          .pipe(map((saved) => this.parseStoredRecord<T>(saved, field)!));
      }),
    );
  }

  private createStorageRow(
    field: SafetyRecordField,
    record: object,
  ): Omit<MockApiLocation, 'id'> {
    return {
      expeditionId: 0,
      touristId: 0,
      latitude: '',
      longitude: '',
      recordedAt: new Date().toISOString(),
      expectedLatitude: '',
      expectedLongitude: '',
      alerts: field === 'alerts' ? JSON.stringify(record) : '',
      telemetry: field === 'telemetry' ? JSON.stringify(record) : '',
      wearables: field === 'wearables' ? JSON.stringify(record) : '',
    };
  }

  private readStoredRecords<T extends { id: string | number }>(
    rows: MockApiLocation[],
    field: SafetyRecordField,
  ): T[] {
    return rows
      .map((row) => this.parseStoredRecord<T>(row, field))
      .filter((record): record is T => record !== null);
  }

  private parseStoredRecord<T extends { id: string | number }>(
    row: MockApiLocation,
    field: SafetyRecordField,
  ): T | null {
    const serialized = row[field];
    if (!serialized) return null;
    try {
      const record: unknown = JSON.parse(serialized);
      if (!record || typeof record !== 'object') return null;
      const data = record as Record<string, unknown>;
      const message = data['message'];
      return {
        ...data,
        ...(field === 'alerts' &&
        typeof message === 'string' &&
        message.startsWith('safety.')
          ? { message: `incidents.${message}` }
          : {}),
        id: row.id,
      } as T;
    } catch {
      return null;
    }
  }

  private mapLocation(row: MockApiLocation): LocationReport | null {
    if (
      row.latitude === undefined ||
      row.longitude === undefined ||
      row.expeditionId === undefined ||
      row.touristId === undefined ||
      !row.recordedAt
    ) {
      return null;
    }
    const latitude = this.parseCoordinate(row.latitude);
    const longitude = this.parseCoordinate(row.longitude);
    if (latitude === null || longitude === null) return null;
    const expectedLatitude =
      row.expectedLatitude === undefined || row.expectedLatitude === ''
        ? undefined
        : this.parseCoordinate(row.expectedLatitude);
    const expectedLongitude =
      row.expectedLongitude === undefined || row.expectedLongitude === ''
        ? undefined
        : this.parseCoordinate(row.expectedLongitude);
    if (expectedLatitude === null || expectedLongitude === null) return null;
    return {
      id: row.id,
      ...(row.incidentId !== undefined ? { incidentId: Number(row.incidentId) } : {}),
      expeditionId: Number(row.expeditionId),
      touristId: Number(row.touristId),
      latitude,
      longitude,
      recordedAt: row.recordedAt,
      ...(expectedLatitude !== undefined ? { expectedLatitude } : {}),
      ...(expectedLongitude !== undefined ? { expectedLongitude } : {}),
    };
  }

  private parseCoordinate(value: string | number): number | null {
    const coordinate = typeof value === 'string' && value.trim() ? Number(value) : value;
    return typeof coordinate === 'number' && Number.isFinite(coordinate)
      ? coordinate
      : null;
  }
}
