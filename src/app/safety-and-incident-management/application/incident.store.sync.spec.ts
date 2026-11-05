import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { IncidentStore } from './incident.store';
import { Incident } from '../domain/model/aggregates/incident.entity';
import { IncidentStatus } from '../domain/model/value-object/incident-status';

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

    const req = httpMock.expectOne((request) => request.method === 'POST');

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

    req.flush(syncedServerResponse);

    expect(store.pendingSyncIncidents().length).toBe(0);

    const rawStorage = localStorage.getItem(OFFLINE_STORAGE_KEY);
    const parsedStorage = rawStorage ? JSON.parse(rawStorage) : [];
    expect(parsedStorage.length).toBe(0);
  });
});
