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
    expect(JSON.parse(rawStorage ?? '[]')[0].description).toBe(newIncident.description);
  });

  it('should not mark other id-zero offline incidents as synced when one report is created', () => {
    const pending = ['offline-one', 'offline-two'].map(
      (uuid) =>
        new Incident({
          id: 0,
          uuid,
          activeTourId: 101,
          reportedByUserId: 10,
          description: uuid,
          latitude: -13,
          longitude: -72,
          reportedAt: new Date().toISOString(),
          status: IncidentStatus.OPEN,
          severity: 'MEDIUM',
          isSynced: false,
        }),
    );
    store['incidentsSignal'].set(pending);
    const newIncident = new Incident({
      id: 0,
      uuid: 'online-report',
      activeTourId: 102,
      reportedByUserId: 11,
      description: 'Online report',
      latitude: -12,
      longitude: -77,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      isSynced: false,
    });

    store.addIncident(newIncident);
    const request = httpMock.expectOne(
      `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/incidents`,
    );
    request.flush({ id: '99' });

    expect(store.incidents().find((item) => item.uuid === 'online-report')?.isSynced).toBe(true);
    expect(store.incidents().filter((item) => item.uuid.startsWith('offline-')).every((item) => !item.isSynced)).toBe(true);
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
        isSynced: false,
      },
    ]);

    expect(store.incidents().length).toBe(1);
    expect(store.incidents()[0].id).toBe(42);
    expect(store.incidents()[0].description).toBe('Remote incident');
    expect(store.incidents()[0].isSynced).toBe(true);
  });

  it('should delete a synced incident from MockAPI and local storage', () => {
    const incident = new Incident({
      id: 42,
      uuid: 'remote-incident',
      activeTourId: 7,
      reportedByUserId: 3,
      description: 'Remote incident',
      latitude: 10,
      longitude: 20,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      isSynced: true,
    });
    store['incidentsSignal'].set([incident]);

    store.deleteIncident(42);

    const request = httpMock.expectOne(
      `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/incidents/42`,
    );
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    store.refreshIncidents();
    httpMock
      .expectOne(`${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/incidents`)
      .flush([]);

    expect(store.incidents()).toEqual([]);
    expect(JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) ?? '[]')).toEqual([]);
  });

  it('should restore a synced incident if the server deletion fails', () => {
    const incident = new Incident({
      id: 43,
      activeTourId: 7,
      reportedByUserId: 3,
      description: 'Incident that cannot be deleted',
      latitude: 10,
      longitude: 20,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      isSynced: true,
    });
    store['incidentsSignal'].set([incident]);

    store.deleteIncident(43);

    const request = httpMock.expectOne(
      `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/incidents/43`,
    );
    request.flush({ message: 'Delete failed' }, { status: 500, statusText: 'Server Error' });

    expect(store.incidents()).toEqual([incident]);
    expect(JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) ?? '[]')).toHaveLength(1);
    expect(store.error()).toBe('incidents.delete_error');
  });

  it('should persist updates to synced incidents in MockAPI', () => {
    const existing = new Incident({
      id: 44,
      activeTourId: 7,
      reportedByUserId: 3,
      description: 'Original description',
      latitude: 10,
      longitude: 20,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      isSynced: true,
    });
    const updated = new Incident({
      id: 44,
      activeTourId: 7,
      reportedByUserId: 3,
      description: 'Updated description',
      latitude: 10,
      longitude: 20,
      reportedAt: existing.reportedAt,
      status: IncidentStatus.RESOLVED,
      isSynced: false,
    });
    store['incidentsSignal'].set([existing]);

    store.updateIncident(updated);

    const request = httpMock.expectOne(
      `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/incidents/44`,
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.description).toBe('Updated description');
    request.flush({
      id: 44,
      uuid: '',
      activeTourId: 7,
      reportedByUserId: 3,
      description: 'Updated description',
      latitude: 10,
      longitude: 20,
      reportedAt: existing.reportedAt,
      status: IncidentStatus.RESOLVED,
      severity: 'MEDIUM',
    });

    expect(store.incidents()[0].description).toBe('Updated description');
    expect(store.incidents()[0].status).toBe(IncidentStatus.RESOLVED);
    expect(store.incidents()[0].isSynced).toBe(true);
    expect(JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) ?? '[]')[0].description).toBe(
      'Updated description',
    );
  });

  it('should resolve a synced incident only with a valid resolution note', () => {
    const incident = new Incident({
      id: 45,
      activeTourId: 7,
      reportedByUserId: 3,
      description: 'Participant needed assistance',
      latitude: 10,
      longitude: 20,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      isSynced: true,
    });
    store['incidentsSignal'].set([incident]);

    store.resolveIncident(incident, ' ');
    expect(store.error()).toBe('incidents.resolution_note_required');
    httpMock.expectNone(
      `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/incidents/45`,
    );

    store.resolveIncident(incident, 'First aid provided.');
    const request = httpMock.expectOne(
      `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/incidents/45`,
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.resolutionNote).toBe('First aid provided.');
    request.flush({
      id: 45,
      uuid: '',
      activeTourId: 7,
      reportedByUserId: 3,
      description: 'Participant needed assistance',
      latitude: 10,
      longitude: 20,
      reportedAt: incident.reportedAt,
      status: IncidentStatus.RESOLVED,
      severity: 'MEDIUM',
      resolutionNote: 'First aid provided.',
      reporterRole: 'GUIDE',
    });

    expect(store.incidents()[0].status).toBe(IncidentStatus.RESOLVED);
    expect(store.incidents()[0].resolutionNote).toBe('First aid provided.');
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
    const failedCreate = httpMock.expectOne(
      `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/incidents`,
    );
    failedCreate.error(new ProgressEvent('error'));
    expect(store.pendingSyncIncidents().length).toBe(1);
    store.syncOfflineIncidents();

    const duplicateCheck = httpMock.expectOne(
      `${environment.incidentsApiBaseUrl.replace(/\/+$/, '')}/incidents`,
    );
    expect(duplicateCheck.request.method).toBe('GET');
    duplicateCheck.flush([]);

    const postReqs = httpMock.match(
      (request) => request.method === 'POST' && request.url.endsWith('/incidents'),
    );
    expect(postReqs.length).toBe(1);

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
