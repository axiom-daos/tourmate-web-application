import { DestroyRef, Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Incident } from '../domain/model/aggregates/incident.entity';
import { IncidentStatus } from '../domain/model/value-object/incident-status';
import { environment } from '../../../environments/environment';
import { IncidentResource } from '../infrastructure/incident-response';

@Injectable({
  providedIn: 'root',
})
export class IncidentStore {
  private http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly OFFLINE_STORAGE_KEY = 'tourmate_offline_incidents';
  private readonly API_URL = `${environment.tourmateProviderApiBaseUrl.replace(/\/+$/, '')}/incidents`;

  private incidentsSignal = signal<Incident[]>(this.loadFromStorage());
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private syncingSignal = signal<boolean>(false);
  private syncRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private syncRetryAttempts = 0;

  readonly incidents = this.incidentsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly syncing = this.syncingSignal.asReadonly();

  readonly pendingSyncIncidents = computed(() =>
    this.incidentsSignal().filter((inc) => !inc.isSynced),
  );

  readonly incidentCount = computed(() => this.incidentsSignal().length);

  constructor() {
    this.refreshIncidents();
    if (typeof window !== 'undefined') {
      const handleOnline = () => {
        this.syncRetryAttempts = 0;
        this.clearSyncRetry();
        this.syncOfflineIncidents();
      };
      window.addEventListener('online', handleOnline);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('online', handleOnline);
        this.clearSyncRetry();
      });
    }
  }

  public refreshIncidents() {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http.get<IncidentResource[]>(this.API_URL).subscribe({
      next: (resources) => {
        const remoteIncidents = resources.map(
          (resource) =>
            new Incident({ ...resource, id: Number(resource.id), isSynced: true }),
        );
        const pendingLocalIncidents = this.pendingSyncIncidents().filter(
          (local) =>
            !remoteIncidents.some(
              (remote) =>
                (local.uuid && remote.uuid === local.uuid) ||
                (local.id > 0 && remote.id === local.id),
            ),
        );
        const incidents = [...pendingLocalIncidents, ...remoteIncidents];

        this.incidentsSignal.set(incidents);
        this.saveToStorage(incidents);
        this.loadingSignal.set(false);
        if (
          this.pendingSyncIncidents().length > 0 &&
          typeof navigator !== 'undefined' &&
          navigator.onLine
        ) {
          this.syncOfflineIncidents();
        }
      },
      error: (error) => {
        this.errorSignal.set('incidents.load_error');
        this.loadingSignal.set(false);
        console.error('Error fetching incidents from API', error);
      },
    });
  }

  private loadFromStorage(): Incident[] {
    try {
      const raw = localStorage.getItem(this.OFFLINE_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.map((item: any) => new Incident(item));
    } catch (e) {
      console.error('Error loading incidents from localStorage', e);
      return [];
    }
  }

  private saveToStorage(incidents: Incident[]) {
    try {
      const resources = incidents.map((incident) => ({
        id: incident.id,
        uuid: incident.uuid,
        activeTourId: incident.activeTourId,
        reportedByUserId: incident.reportedByUserId,
        description: incident.description,
        latitude: incident.latitude,
        longitude: incident.longitude,
        reportedAt: incident.reportedAt,
        status: incident.status,
        severity: incident.severity,
        isSynced: incident.isSynced,
        resolutionNote: incident.resolutionNote,
        reporterRole: incident.reporterRole,
      }));
      localStorage.setItem(this.OFFLINE_STORAGE_KEY, JSON.stringify(resources));
    } catch (e) {
      console.error('Error saving incidents to localStorage', e);
    }
  }

  public getIncidentById(id: number) {
    return computed(() => this.incidentsSignal().find((inc) => inc.id === id));
  }

  public addIncident(incident: Incident) {
    if (!incident.uuid) {
      incident.uuid = 'off-' + Math.random().toString(36).substring(2, 9);
    }

    const updated = [incident, ...this.incidentsSignal()];
    this.incidentsSignal.set(updated);
    this.saveToStorage(updated);

    const payload = {
      uuid: incident.uuid,
      activeTourId: incident.activeTourId,
      reportedByUserId: incident.reportedByUserId,
      description: incident.description,
      latitude: incident.latitude,
      longitude: incident.longitude,
      reportedAt: incident.reportedAt,
      status: incident.status,
      severity: incident.severity,
      isSynced: true,
      resolutionNote: incident.resolutionNote,
      reporterRole: incident.reporterRole,
    };

    this.http.post<IncidentResource>(this.API_URL, payload).subscribe({
      next: (response) => {
        const current = this.incidentsSignal();
        const synced = current.map((inc) => {
          if (inc.uuid === incident.uuid) {
            return new Incident({
              id: Number(response.id),
              uuid: inc.uuid,
              activeTourId: inc.activeTourId,
              reportedByUserId: inc.reportedByUserId,
              description: inc.description,
              latitude: inc.latitude,
              longitude: inc.longitude,
              reportedAt: inc.reportedAt,
              status: inc.status,
              severity: inc.severity,
              isSynced: true,
              resolutionNote: inc.resolutionNote,
              reporterRole: inc.reporterRole,
            });
          }
          return inc;
        });
        this.incidentsSignal.set(synced);
        this.saveToStorage(synced);
      },
      error: (err) => {
        console.warn('Network unavailable, incident kept offline in queue.', err);
        this.scheduleSyncRetry();
      },
    });
  }

  public updateIncident(incident: Incident) {
    const current = this.incidentsSignal();
    const existing = current.find(
      (item) =>
        (incident.id > 0 && item.id === incident.id) ||
        (!!incident.uuid && item.uuid === incident.uuid),
    );
    if (!existing) return;

    if (!existing.isSynced) {
      const updated = current.map((item) =>
        item === existing
          ? new Incident({
              id: incident.id,
              uuid: incident.uuid || existing.uuid,
              activeTourId: incident.activeTourId,
              reportedByUserId: incident.reportedByUserId,
              description: incident.description,
              latitude: incident.latitude,
              longitude: incident.longitude,
              reportedAt: incident.reportedAt,
              status: incident.status,
              severity: incident.severity,
              isSynced: false,
              resolutionNote: incident.resolutionNote,
              reporterRole: incident.reporterRole,
            })
          : item,
      );
      this.incidentsSignal.set(updated);
      this.saveToStorage(updated);
      return;
    }

    const payload = {
      id: existing.id,
      uuid: incident.uuid || existing.uuid,
      activeTourId: incident.activeTourId,
      reportedByUserId: incident.reportedByUserId,
      description: incident.description,
      latitude: incident.latitude,
      longitude: incident.longitude,
      reportedAt: incident.reportedAt,
      status: incident.status,
      severity: incident.severity,
      isSynced: true,
      resolutionNote: incident.resolutionNote,
      reporterRole: incident.reporterRole,
    };

    this.http.put<IncidentResource>(`${this.API_URL}/${existing.id}`, payload).subscribe({
      next: (resource) => {
        const updatedIncident = new Incident({
          ...resource,
          id: Number(resource.id),
          isSynced: true,
        });
        const updated = this.incidentsSignal().map((item) =>
          item.id === existing.id ? updatedIncident : item,
        );
        this.incidentsSignal.set(updated);
        this.saveToStorage(updated);
        this.errorSignal.set(null);
      },
      error: (error) => {
        this.errorSignal.set('incidents.update_error');
        console.error('Error updating incident in API', error);
      },
    });
  }

  public resolveIncident(incident: Incident, note: string) {
    if (note.trim().length < 5) {
      this.errorSignal.set('incidents.resolution_note_required');
      return;
    }
    this.updateIncident(
      new Incident({
        id: incident.id,
        uuid: incident.uuid,
        activeTourId: incident.activeTourId,
        reportedByUserId: incident.reportedByUserId,
        description: incident.description,
        latitude: incident.latitude,
        longitude: incident.longitude,
        reportedAt: incident.reportedAt,
        status: IncidentStatus.RESOLVED,
        severity: incident.severity,
        isSynced: incident.isSynced,
        resolutionNote: note.trim(),
        reporterRole: incident.reporterRole,
      }),
    );
  }

  public deleteIncident(id: number) {
    const current = this.incidentsSignal();
    const incident = current.find((item) => Number(item.id) === Number(id));
    if (!incident) return;

    const index = current.indexOf(incident);
    const filtered = current.filter((item) => item !== incident);
    this.incidentsSignal.set(filtered);
    this.saveToStorage(filtered);

    if (!incident.isSynced || incident.id <= 0) return;

    this.http.delete<void>(`${this.API_URL}/${incident.id}`).subscribe({
      next: () => this.errorSignal.set(null),
      error: (error) => {
        const latest = this.incidentsSignal();
        if (!latest.some((item) => item.id === incident.id)) {
          const restored = [...latest];
          restored.splice(Math.min(index, restored.length), 0, incident);
          this.incidentsSignal.set(restored);
          this.saveToStorage(restored);
        }
        this.errorSignal.set('incidents.delete_error');
        console.error('Error deleting incident from API', error);
      },
    });
  }

  public syncOfflineIncidents() {
    if (this.syncingSignal()) return;
    this.clearSyncRetry();

    const pending = this.pendingSyncIncidents();
    if (pending.length === 0) return;

    pending.forEach((incident) => {
      if (!incident.uuid) {
        incident.uuid = `off-${Math.random().toString(36).substring(2, 9)}`;
      }
    });
    this.saveToStorage(this.incidentsSignal());
    this.syncingSignal.set(true);
    this.http.get<IncidentResource[]>(this.API_URL).subscribe({
      next: (remoteResources) => {
        const remoteByUuid = new Map(
          remoteResources
            .filter((resource) => resource.uuid)
            .map((resource) => [resource.uuid, resource]),
        );
        const current = this.incidentsSignal();
        const serverDuplicates = new Map<string, IncidentResource>();
        for (const incident of pending) {
          const remote = remoteByUuid.get(incident.uuid);
          if (remote) serverDuplicates.set(incident.uuid, remote);
        }

        const alreadySynced = current.map((incident) => {
          const remote = serverDuplicates.get(incident.uuid);
          return remote
            ? this.toSyncedIncident(incident, Number(remote.id))
            : incident;
        });
        this.incidentsSignal.set(alreadySynced);
        this.saveToStorage(alreadySynced);

        const toCreate = pending.filter((incident) => !serverDuplicates.has(incident.uuid));
        if (toCreate.length === 0) {
          this.syncingSignal.set(false);
          this.syncRetryAttempts = 0;
          return;
        }

        const requests = toCreate.map((incident) =>
          this.http.post<IncidentResource>(this.API_URL, {
            uuid: incident.uuid,
            activeTourId: incident.activeTourId,
            reportedByUserId: incident.reportedByUserId,
            description: incident.description,
            latitude: incident.latitude,
            longitude: incident.longitude,
            reportedAt: incident.reportedAt,
            status: incident.status,
            severity: incident.severity,
            isSynced: true,
            resolutionNote: incident.resolutionNote,
            reporterRole: incident.reporterRole,
          }),
        );

        forkJoin(requests).subscribe({
          next: (responses) => {
            const idsByUuid = new Map(
              responses.map((response, index) => [
                toCreate[index].uuid,
                Number(response.id),
              ]),
            );
            const synced = this.incidentsSignal().map((incident) => {
              const serverId = idsByUuid.get(incident.uuid);
              return serverId === undefined
                ? incident
                : this.toSyncedIncident(incident, serverId);
            });
            this.incidentsSignal.set(synced);
            this.saveToStorage(synced);
            this.syncingSignal.set(false);
            this.syncRetryAttempts = 0;
          },
          error: (error) => {
            this.syncingSignal.set(false);
            console.warn('Sync burst failed; pending incidents were retained locally.', error);
            this.scheduleSyncRetry();
          },
        });
      },
      error: (error) => {
        this.syncingSignal.set(false);
        console.warn('Could not check for duplicate incidents before syncing.', error);
        this.scheduleSyncRetry();
      },
    });
  }

  private toSyncedIncident(incident: Incident, serverId: number): Incident {
    return new Incident({
      id: serverId,
      uuid: incident.uuid,
      activeTourId: incident.activeTourId,
      reportedByUserId: incident.reportedByUserId,
      description: incident.description,
      latitude: incident.latitude,
      longitude: incident.longitude,
      reportedAt: incident.reportedAt,
      status: incident.status,
      severity: incident.severity,
      isSynced: true,
      resolutionNote: incident.resolutionNote,
      reporterRole: incident.reporterRole,
    });
  }

  private scheduleSyncRetry(): void {
    if (this.syncRetryTimer !== null || this.syncRetryAttempts >= 3) return;

    const delay = Math.min(1000 * 2 ** this.syncRetryAttempts, 8000);
    this.syncRetryAttempts += 1;
    this.syncRetryTimer = setTimeout(() => {
      this.syncRetryTimer = null;
      if (typeof navigator === 'undefined' || navigator.onLine) {
        this.syncOfflineIncidents();
      }
    }, delay);
  }

  private clearSyncRetry(): void {
    if (this.syncRetryTimer === null) return;
    clearTimeout(this.syncRetryTimer);
    this.syncRetryTimer = null;
  }

}
