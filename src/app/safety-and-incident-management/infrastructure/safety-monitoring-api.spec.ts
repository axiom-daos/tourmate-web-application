import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { SafetyMonitoringApi } from './safety-monitoring-api';

describe('SafetyMonitoringApi', () => {
  let api: SafetyMonitoringApi;
  let httpMock: HttpTestingController;
  const locationsUrl = `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/locations`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SafetyMonitoringApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(SafetyMonitoringApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads incident-associated records from the current MockAPI resource', () => {
    let response: unknown;
    api.getSafetyData().subscribe((data) => (response = data));
    httpMock.expectOne(locationsUrl).flush([
      {
        id: 'location-1',
        incidentId: 31,
        expeditionId: 12,
        touristId: 7,
        latitude: '-13.156',
        longitude: '-72.526',
        recordedAt: '2026-10-01T09:20:00.000Z',
        expectedLatitude: '',
        expectedLongitude: '',
        alerts: '',
        telemetry: JSON.stringify({
          incidentId: 31,
          expeditionId: 12,
          touristId: 7,
          wearableId: 'device-7',
          heartRate: 82,
          bloodOxygen: 98,
          batteryLevel: 90,
          connectivity: 'CONNECTED',
          recordedAt: '2026-10-01T09:21:00.000Z',
        }),
        wearables: JSON.stringify({
          incidentId: 31,
          deviceId: 'device-7',
          touristId: 7,
          activeExpeditionId: 12,
          batteryLevel: 90,
          connectivity: 'CONNECTED',
          lastSyncAt: '2026-10-01T09:21:00.000Z',
        }),
      },
    ]);

    expect(response).toEqual({
      locations: [
        {
          id: 'location-1',
          incidentId: 31,
          expeditionId: 12,
          touristId: 7,
          latitude: -13.156,
          longitude: -72.526,
          recordedAt: '2026-10-01T09:20:00.000Z',
        },
      ],
      alerts: [],
      telemetry: [
        {
          id: 'location-1',
          incidentId: 31,
          expeditionId: 12,
          touristId: 7,
          wearableId: 'device-7',
          heartRate: 82,
          bloodOxygen: 98,
          batteryLevel: 90,
          connectivity: 'CONNECTED',
          recordedAt: '2026-10-01T09:21:00.000Z',
        },
      ],
      wearables: [
        {
          id: 'location-1',
          incidentId: 31,
          deviceId: 'device-7',
          touristId: 7,
          activeExpeditionId: 12,
          batteryLevel: 90,
          connectivity: 'CONNECTED',
          lastSyncAt: '2026-10-01T09:21:00.000Z',
        },
      ],
    });
  });

  it('updates participant coordinates using string fields and preserves the resource columns', () => {
    let response: unknown;
    api
      .updateLocation({
        id: 'location-1',
        incidentId: 31,
        expeditionId: 12,
        touristId: 7,
        latitude: -13.2,
        longitude: -72.6,
        recordedAt: '2026-10-01T09:20:00.000Z',
      })
      .subscribe((location) => (response = location));

    httpMock.expectOne(`${locationsUrl}/location-1`).flush({
      id: 'location-1',
      expeditionId: 12,
      touristId: 7,
      latitude: '-13.156',
      longitude: '-72.526',
      recordedAt: '2026-10-01T09:20:00.000Z',
      expectedLatitude: '',
      expectedLongitude: '',
      alerts: '',
      telemetry: '',
      wearables: '',
    });
    const update = httpMock.expectOne(`${locationsUrl}/location-1`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body.latitude).toBe('-13.2');
    expect(update.request.body.longitude).toBe('-72.6');
    expect(update.request.body.telemetry).toBe('');
    update.flush({
      ...update.request.body,
      id: 'location-1',
    });

    expect(response).toEqual(
      expect.objectContaining({
        incidentId: 31,
        latitude: -13.2,
        longitude: -72.6,
      }),
    );
  });

  it('updates health data in the telemetry string column', () => {
    const telemetry = {
      id: 'record-1',
      incidentId: 31,
      expeditionId: 12,
      touristId: 7,
      wearableId: 'device-7',
      heartRate: 110,
      bloodOxygen: 96,
      batteryLevel: 75,
      connectivity: 'CONNECTED' as const,
      recordedAt: '2026-10-01T09:21:00.000Z',
    };
    api.updateTelemetry(telemetry).subscribe();

    httpMock.expectOne(`${locationsUrl}/record-1`).flush({
      id: 'record-1',
      expeditionId: 0,
      touristId: 0,
      latitude: '',
      longitude: '',
      recordedAt: '2026-10-01T09:20:00.000Z',
      expectedLatitude: '',
      expectedLongitude: '',
      alerts: '',
      telemetry: JSON.stringify({ ...telemetry, heartRate: 82 }),
      wearables: '',
    });
    const update = httpMock.expectOne(`${locationsUrl}/record-1`);
    expect(update.request.method).toBe('PUT');
    expect(JSON.parse(update.request.body.telemetry).heartRate).toBe(110);
    update.flush({ ...update.request.body, id: 'record-1' });
  });
});
