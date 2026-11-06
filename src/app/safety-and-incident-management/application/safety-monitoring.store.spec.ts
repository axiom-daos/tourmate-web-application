import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { SafetyMonitoringStore } from './safety-monitoring.store';

describe('SafetyMonitoringStore', () => {
  let store: SafetyMonitoringStore;
  let httpMock: HttpTestingController;
  const apiBase = environment.incidentsApiBaseUrl.replace(/\/+$/, '');
  const currentDate = new Date().toISOString();
  const wearable = {
    id: 'device-record-1',
    deviceId: 'wearable-1',
    touristId: 7,
    batteryLevel: 90,
    connectivity: 'CONNECTED' as const,
    lastSyncAt: currentDate,
    activeExpeditionId: 12,
  };
  const storageRow = (
    id: string,
    fields: Partial<Record<'alerts' | 'telemetry' | 'wearables', string>> = {},
  ) => ({
    id,
    expeditionId: 0,
    touristId: 0,
    latitude: '',
    longitude: '',
    recordedAt: currentDate,
    expectedLatitude: '',
    expectedLongitude: '',
    alerts: '',
    telemetry: '',
    wearables: '',
    ...fields,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SafetyMonitoringStore, provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(SafetyMonitoringStore);
    httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne(`${apiBase}/incidents`).flush([]);
    httpMock.expectOne(`${apiBase}/locations`).flush([
      storageRow('device-record-1', { wearables: JSON.stringify(wearable) }),
    ]);
  });

  afterEach(() => httpMock.verify());

  it('converts string coordinates from MockAPI to numbers for monitoring', () => {
    store.refresh();

    httpMock.expectOne(`${apiBase}/locations`).flush([
      {
        id: 'location-1',
        expeditionId: 12,
        touristId: 7,
        latitude: '12.345',
        longitude: '-76.543',
        expectedLatitude: '12.3',
        expectedLongitude: '-76.5',
        recordedAt: currentDate,
        alerts: '',
        telemetry: '',
        wearables: '',
      },
    ]);

    expect(store.locations()[0]).toEqual({
      id: 'location-1',
      expeditionId: 12,
      touristId: 7,
      latitude: 12.345,
      longitude: -76.543,
      expectedLatitude: 12.3,
      expectedLongitude: -76.5,
      recordedAt: currentDate,
    });
  });

  it('records a valid location and creates a route deviation alert beyond 500 meters', () => {
    store.reportLocation({
      expeditionId: 12,
      touristId: 7,
      latitude: 0.01,
      longitude: 0,
      expectedLatitude: 0,
      expectedLongitude: 0,
      recordedAt: currentDate,
    });

    const locationRequest = httpMock.expectOne(`${apiBase}/locations`);
    expect(locationRequest.request.method).toBe('POST');
    expect(locationRequest.request.body.latitude).toBe('0.01');
    expect(locationRequest.request.body.longitude).toBe('0');
    expect(locationRequest.request.body.expectedLatitude).toBe('0');
    expect(locationRequest.request.body.expectedLongitude).toBe('0');
    locationRequest.flush({
      id: 'location-1',
      expeditionId: 12,
      touristId: 7,
      latitude: '0.01',
      longitude: '0',
      recordedAt: currentDate,
      expectedLatitude: '0',
      expectedLongitude: '0',
    });

    const alertRequest = httpMock.expectOne(`${apiBase}/locations`);
    expect(JSON.parse(alertRequest.request.body.alerts).type).toBe('ROUTE_DEVIATION');
    alertRequest.flush({
      ...storageRow('alert-1', alertRequest.request.body),
    });

    expect(store.locations()).toHaveLength(1);
    expect(store.activeAlerts()).toHaveLength(1);
  });

  it('rejects invalid coordinates before sending a request', () => {
    store.reportLocation({
      expeditionId: 12,
      touristId: 7,
      latitude: 91,
      longitude: 0,
      recordedAt: currentDate,
    });

    expect(store.error()).toBe('incidents.safety.invalid_location');
    httpMock.expectNone(`${apiBase}/locations`);
  });

  it('rejects telemetry from an unregistered wearable', () => {
    store.ingestTelemetry({
      expeditionId: 12,
      touristId: 7,
      wearableId: 'unknown-device',
      heartRate: 80,
      bloodOxygen: 98,
      batteryLevel: 80,
      connectivity: 'CONNECTED',
      recordedAt: currentDate,
    });

    expect(store.error()).toBe('incidents.safety.wearable_not_registered');
    httpMock.expectNone(`${apiBase}/locations`);
  });

  it('stores valid telemetry and creates a critical health alert', () => {
    store.ingestTelemetry({
      expeditionId: 12,
      touristId: 7,
      wearableId: 'wearable-1',
      heartRate: 130,
      bloodOxygen: 88,
      batteryLevel: 70,
      connectivity: 'CONNECTED',
      recordedAt: currentDate,
    });

    const telemetryRequest = httpMock.expectOne(`${apiBase}/locations`);
    expect(telemetryRequest.request.method).toBe('POST');
    expect(JSON.parse(telemetryRequest.request.body.telemetry).wearableId).toBe('wearable-1');
    telemetryRequest.flush({
      ...storageRow('telemetry-1', telemetryRequest.request.body),
    });

    const alertRequest = httpMock.expectOne(`${apiBase}/locations`);
    expect(JSON.parse(alertRequest.request.body.alerts).type).toBe('HEALTH_CRITICAL');
    alertRequest.flush({
      ...storageRow('alert-2', alertRequest.request.body),
    });

    const wearableGet = httpMock.expectOne(`${apiBase}/locations/${wearable.id}`);
    expect(wearableGet.request.method).toBe('GET');
    wearableGet.flush(
      storageRow('device-record-1', { wearables: JSON.stringify(wearable) }),
    );

    const wearableRequest = httpMock.expectOne(`${apiBase}/locations/${wearable.id}`);
    expect(wearableRequest.request.method).toBe('PUT');
    expect(JSON.parse(wearableRequest.request.body.wearables).batteryLevel).toBe(70);
    wearableRequest.flush(storageRow('device-record-1', wearableRequest.request.body));

    expect(store.latestTelemetry()).toHaveLength(1);
    expect(store.activeAlerts()).toHaveLength(1);
    expect(store.wearables()[0].batteryLevel).toBe(70);
  });

  it('prevents unlinking a wearable assigned to an active expedition', () => {
    store.unlinkWearable(wearable);

    expect(store.error()).toBe('incidents.safety.wearable_active_expedition');
    httpMock.expectNone(`${apiBase}/locations/${wearable.id}`);
  });

  it('exports the selected expedition records as escaped CSV', () => {
    store['locationsSignal'].set([
      {
        id: 'location,1',
        expeditionId: 12,
        touristId: 7,
        latitude: 10,
        longitude: 20,
        recordedAt: currentDate,
      },
    ]);

    const report = store.exportExpeditionReport(12);

    expect(report).toContain('"location,1"');
    expect(report).toContain('"location,1",12,7');
  });
});
