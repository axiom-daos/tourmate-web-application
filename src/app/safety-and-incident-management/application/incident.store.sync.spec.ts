import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { IncidentStore } from './incident.store';
import { Incident } from '../domain/model/aggregates/incident.entity';
import { IncidentStatus } from '../domain/model/value-object/incident-status';
import { environment } from '../../../environments/environment';

describe('IncidentStore - Sync Bursts & Automatic Synchronization', () => {
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

    const initialReq = httpMock.match(() => true);
    initialReq.forEach((req) => req.flush([]));
  });

  afterEach(() => {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    httpMock.verify();
  });

  it('should automatically sync pending offline incidents in a burst when network is available', () => {
    const pendingIncident = new Incident({
      id: 0,
      uuid: 'off-burst-001',
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

    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify([pendingIncident]));
    store['incidentsSignal'].set([pendingIncident]);

    expect(store.pendingSyncIncidents().length).toBe(1);

    store.syncOfflineIncidents();

    const duplicateCheck = httpMock.expectOne(
      `${environment.tourmateProviderApiBaseUrl.replace(/\/+$/, '')}/incidents`,
    );
    expect(duplicateCheck.request.method).toBe('GET');
    duplicateCheck.flush([]);

    const req = httpMock.expectOne((request) => request.method === 'POST');

    const syncedServerResponse = {
      id: '501',
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

    expect(req.request.body.id).toBeUndefined();
    expect(req.request.body.isSynced).toBe(true);
    req.flush(syncedServerResponse);

    expect(store.pendingSyncIncidents().length).toBe(0);
    expect(store.incidents()[0].id).toBe(501);
    expect(store.incidents()[0].isSynced).toBe(true);

    const storedIncidents = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) ?? '[]');
    expect(storedIncidents[0].isSynced).toBe(true);

    store.refreshIncidents();
    httpMock
      .expectOne(`${environment.tourmateProviderApiBaseUrl.replace(/\/+$/, '')}/incidents`)
      .flush([{ ...syncedServerResponse, isSynced: false }]);

    expect(store.pendingSyncIncidents().length).toBe(0);
    expect(store.incidents()[0].id).toBe(501);

    store.deleteIncident(501);
    const deleteRequest = httpMock.expectOne(
      `${environment.tourmateProviderApiBaseUrl.replace(/\/+$/, '')}/incidents/501`,
    );
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);

    expect(store.incidents()).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) ?? '[]')).toHaveLength(0);
  });

  it('should recognize an incident already on the server and avoid creating a duplicate', () => {
    const pendingIncident = new Incident({
      id: 0,
      uuid: 'off-existing-incident',
      activeTourId: 103,
      reportedByUserId: 18,
      description: 'Already synced before the previous request failed',
      latitude: -12,
      longitude: -77,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      severity: 'MEDIUM',
      isSynced: false,
    });
    store['incidentsSignal'].set([pendingIncident]);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify([pendingIncident]));

    store.syncOfflineIncidents();

    const duplicateCheck = httpMock.expectOne(
      `${environment.tourmateProviderApiBaseUrl.replace(/\/+$/, '')}/incidents`,
    );
    duplicateCheck.flush([
      {
        id: '700',
        uuid: 'off-existing-incident',
        activeTourId: 103,
        reportedByUserId: 18,
        description: pendingIncident.description,
        latitude: pendingIncident.latitude,
        longitude: pendingIncident.longitude,
        reportedAt: pendingIncident.reportedAt,
        status: IncidentStatus.OPEN,
        severity: 'MEDIUM',
        isSynced: false,
      },
    ]);

    expect(store.pendingSyncIncidents()).toHaveLength(0);
    expect(store.incidents()[0].id).toBe(700);
    expect(JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) ?? '[]')[0].isSynced).toBe(true);
    httpMock.expectNone(
      (request) =>
        request.method === 'POST' &&
        request.url === `${environment.tourmateProviderApiBaseUrl.replace(/\/+$/, '')}/incidents`,
    );

    store.deleteIncident(700);
    const deleteRequest = httpMock.expectOne(
      `${environment.tourmateProviderApiBaseUrl.replace(/\/+$/, '')}/incidents/700`,
    );
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    expect(store.incidents()).toHaveLength(0);
  });

  it('automatically retries queued incidents when connectivity is restored', () => {
    const queuedIncident = new Incident({
      id: 0,
      uuid: 'off-reconnect-001',
      activeTourId: 104,
      reportedByUserId: 20,
      description: 'Report queued while offline',
      latitude: -12,
      longitude: -77,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      severity: 'HIGH',
      isSynced: false,
    });
    store['incidentsSignal'].set([queuedIncident]);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify([queuedIncident]));

    window.dispatchEvent(new Event('online'));

    const duplicateCheck = httpMock.expectOne(
      `${environment.tourmateProviderApiBaseUrl.replace(/\/+$/, '')}/incidents`,
    );
    duplicateCheck.flush([]);

    const createRequest = httpMock.expectOne(
      (request) => request.method === 'POST' && request.url.endsWith('/incidents'),
    );
    createRequest.flush({
      id: '701',
      uuid: queuedIncident.uuid,
      activeTourId: queuedIncident.activeTourId,
      reportedByUserId: queuedIncident.reportedByUserId,
      description: queuedIncident.description,
      latitude: queuedIncident.latitude,
      longitude: queuedIncident.longitude,
      reportedAt: queuedIncident.reportedAt,
      status: queuedIncident.status,
      severity: queuedIncident.severity,
    });

    expect(store.pendingSyncIncidents()).toHaveLength(0);
    expect(store.incidents()[0].id).toBe(701);
  });
});
