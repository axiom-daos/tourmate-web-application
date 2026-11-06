import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { IncidentStore } from './incident.store';
import { Incident } from '../domain/model/aggregates/incident.entity';
import { IncidentStatus } from '../domain/model/value-object/incident-status';
import { environment } from '../../../environments/environment';

describe('IncidentStore - Offline-First Resilience & Sync Bursts', () => {
  let store: IncidentStore;
  let httpMock: HttpTestingController;
  const OFFLINE_STORAGE_KEY = 'tourmate_offline_incidents';

  beforeEach(() => {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);

    TestBed.configureTestingModule({
      providers: [IncidentStore, provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(IncidentStore);
    httpMock = TestBed.inject(HttpTestingController);

    const initialReqs = httpMock.match(() => true);
    initialReqs.forEach((req) => req.flush([]));
  });

  afterEach(() => {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    const pendingReqs = httpMock.match(() => true);
    pendingReqs.forEach((req) => {
      if (!req.cancelled) req.flush({});
    });
    httpMock.verify();
  });

  it('should persist an incident locally with isSynced false when added', () => {
    const newIncident = new Incident({
      id: 0,
      activeTourId: 101,
      reportedByUserId: 10,
      description: 'Emergency rescue needed in trail',
      latitude: -13.1631,
      longitude: -72.545,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      severity: 'CRITICAL',
      isSynced: false,
    });

    store.addIncident(newIncident);

    const postReqs = httpMock.match((req) => req.method === 'POST');
    expect(postReqs.length).toBe(1);
    expect(postReqs[0].request.url).toBe(
      `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/incidents`,
    );
    postReqs.forEach((req) => req.flush({ ...newIncident, id: 99, isSynced: true }));

    expect(store.incidentCount()).toBeGreaterThan(0);

    const rawStorage = localStorage.getItem(OFFLINE_STORAGE_KEY);
    expect(rawStorage).toBeTruthy();
  });

  it('should load incidents from the configured MockAPI endpoint', () => {
    store.refreshIncidents();

    const request = httpMock.expectOne(
      `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/incidents`,
    );
    expect(request.request.method).toBe('GET');

    request.flush([
      {
        id: 42,
        uuid: 'remote-incident',
        activeTourId: 7,
        reportedByUserId: 3,
        description: 'Remote incident',
        latitude: 10,
        longitude: 20,
        reportedAt: new Date().toISOString(),
        status: IncidentStatus.OPEN,
        severity: 'HIGH',
      },
    ]);

    expect(store.incidents().length).toBe(1);
    expect(store.incidents()[0].id).toBe(42);
    expect(store.incidents()[0].description).toBe('Remote incident');
  });

  it('should compute pendingSyncIncidents correctly filtering by un-synced items', () => {
    const localIncident = new Incident({
      id: 0,
      activeTourId: 101,
      reportedByUserId: 10,
      description: 'Unsynced offline incident',
      latitude: -12.0,
      longitude: -77.0,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      severity: 'HIGH',
      isSynced: false,
    });
    localIncident.uuid = 'off-test123';

    store.addIncident(localIncident);

    const pending = store.pendingSyncIncidents();
    expect(pending.length).toBe(1);
    expect(pending[0].uuid).toEqual('off-test123');
  });

  it('should automatically sync pending offline incidents in a burst when network is available', () => {
    const pendingIncident = new Incident({
      id: 0,
      activeTourId: 102,
      reportedByUserId: 15,
      description: 'Pending sync incident in remote area',
      latitude: -12.0464,
      longitude: -77.0428,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      severity: 'HIGH',
      isSynced: false,
    });
    pendingIncident.uuid = 'off-burst-001';

    store.addIncident(pendingIncident);
    expect(store.pendingSyncIncidents().length).toBe(1);

    store.syncOfflineIncidents();

    const postReqs = httpMock.match((request) => request.method === 'POST');
    expect(postReqs.length).toBeGreaterThan(0);

    const syncedServerResponse = {
      id: 501,
      uuid: 'off-burst-001',
      activeTourId: 102,
      reportedByUserId: 15,
      description: 'Pending sync incident in remote area',
      latitude: -12.0464,
      longitude: -77.0428,
      reportedAt: pendingIncident.reportedAt,
      status: IncidentStatus.OPEN,
      severity: 'HIGH',
      isSynced: true,
    };

    postReqs.forEach((req) => req.flush(syncedServerResponse));

    expect(store.pendingSyncIncidents().length).toBe(0);
  });
});
