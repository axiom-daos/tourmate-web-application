import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { Incident } from '../domain/model/aggregates/incident.entity';
import { IncidentApi } from '../infrastructure/incident-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';

/**
 * Holds incident application state and coordinates incident-related application layer behavior,
 * incorporating offline-first queueing and automatic synchronization bursts.
 */
@Injectable({
  providedIn: 'root',
})
export class IncidentStore {
  private readonly incidentApi = inject(IncidentApi);
  private readonly OFFLINE_STORAGE_KEY = 'tourmate_offline_incidents';

  private readonly incidentsSignal = signal<Incident[]>([]);

  /**
   * Readonly signal for the list of incidents.
   */
  readonly incidents = this.incidentsSignal.asReadonly();

  /**
   * Computed signal for the count of incidents.
   */
  readonly incidentCount = computed(() => this.incidents().length);

  /**
   * Computed signal for incidents waiting to be synced in remote areas.
   */
  readonly pendingSyncIncidents = computed(() =>
    this.incidents().filter((incident) => !incident.isSynced),
  );

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    this.loadIncidents();
  }

  getIncidentById = (id: number): Signal<Incident | undefined> =>
    computed(() => (id ? this.incidents().find((i) => i.id === id) : undefined));

  /**
   * Adds a new incident with Offline-First support.
   * If network fails or user is offline, stores it locally with isSynced = false.
   */
  addIncident = (incident: Incident): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (isOffline) {
      this.saveOfflineIncident(incident);
      return;
    }

    this.incidentApi
      .createIncident(incident)
      .pipe(retry(2))
      .subscribe({
        next: (createdIncident) => {
          createdIncident.isSynced = true;
          this.incidentsSignal.update((incidents) => [...incidents, createdIncident]);
          this.loadingSignal.set(false);
          this.syncOfflineIncidents();
        },
        error: (err) => {
          console.warn('Network error detected. Saving incident to local offline queue.', err);
          this.saveOfflineIncident(incident);
        },
      });
  };

  updateIncident = (updatedIncident: Incident): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

   if (!updatedIncident.isSynced) {
      this.incidentsSignal.update((incidents) =>
        incidents.map((i) => (i.uuid === updatedIncident.uuid ? updatedIncident : i)),
      );
      this.loadingSignal.set(false);
      return;
    }

    this.incidentApi
      .updateIncident(updatedIncident)
      .pipe(retry(2))
      .subscribe({
        next: (incident) => {
          this.incidentsSignal.update((incidents) =>
            incidents.map((i) => (i.id === incident.id ? incident : i)),
          );
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to update incident'));
          this.loadingSignal.set(false);
        },
      });
  };

  resolveIncident = (incident: Incident): void => {
    incident.resolve();
    this.updateIncident(incident);
  };

  deleteIncident = (id: number): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.incidentApi
      .deleteIncident(id)
      .pipe(retry(2))
      .subscribe({
        next: () => {
          this.incidentsSignal.update((incidents) => incidents.filter((i) => i.id !== id));
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to delete incident'));
          this.loadingSignal.set(false);
        },
      });
  };

  /**
   * Syncs locally queued offline incidents in a burst when connectivity is restored.
   */
  syncOfflineIncidents = (): void => {
    const pending = this.pendingSyncIncidents();
    if (pending.length === 0) return;

    pending.forEach((incident) => {
      this.incidentApi.createIncident(incident).subscribe({
        next: (synced) => {
          this.incidentsSignal.update((list) =>
            list.map((i) => (i.uuid === incident.uuid ? synced : i)),
          );
          this.removeLocalOfflineIncident(incident.uuid);
        },
        error: () => {},
      });
    });
  };

  private loadIncidents = (): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.incidentApi
      .getIncidents()
      .pipe(retry(2))
      .subscribe({
        next: (incidents) => {
          const localQueue = this.getLocalOfflineIncidents();
          this.incidentsSignal.set([...incidents, ...localQueue]);
          this.loadingSignal.set(false);
          this.errorSignal.set(null);

          if (localQueue.length > 0) {
            this.syncOfflineIncidents();
          }
        },
        error: (err) => {
          const localQueue = this.getLocalOfflineIncidents();
          if (localQueue.length > 0) {
            this.incidentsSignal.set(localQueue);
          } else {
            this.errorSignal.set(this.formatError(err, 'Failed to load incidents'));
          }
          this.loadingSignal.set(false);
        },
      });
  };

  private saveOfflineIncident(incident: Incident): void {
    if (!incident.uuid) {
      incident.uuid = 'off-' + Math.random().toString(36).substring(2, 9);
    }
    incident.isSynced = false;

    const currentLocal = this.getLocalRawData();
    currentLocal.push({
      id: incident.id || Date.now(),
      uuid: incident.uuid,
      activeTourId: incident.activeTourId,
      reportedByUserId: incident.reportedByUserId,
      description: incident.description,
      latitude: incident.latitude,
      longitude: incident.longitude,
      reportedAt: incident.reportedAt,
      status: incident.status,
      severity: incident.severity,
      isSynced: false,
    });

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.OFFLINE_STORAGE_KEY, JSON.stringify(currentLocal));
    }

    this.incidentsSignal.update((incidents) => [...incidents, incident]);
    this.loadingSignal.set(false);
  }

  private getLocalOfflineIncidents(): Incident[] {
    const raw = this.getLocalRawData();
    return raw.map(
      (item: any) =>
        new Incident({
          id: item.id,
          uuid: item.uuid,
          activeTourId: item.activeTourId,
          reportedByUserId: item.reportedByUserId,
          description: item.description,
          latitude: item.latitude,
          longitude: item.longitude,
          reportedAt: item.reportedAt,
          status: item.status,
          severity: item.severity,
          isSynced: item.isSynced,
        }),
    );
  }

  private getLocalRawData(): any[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.OFFLINE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private removeLocalOfflineIncident(uuid: string): void {
    if (typeof localStorage === 'undefined') return;
    const raw = this.getLocalRawData();
    const filtered = raw.filter((i: any) => i.uuid !== uuid);
    localStorage.setItem(this.OFFLINE_STORAGE_KEY, JSON.stringify(filtered));
  }

  private formatError = (error: unknown, fallback: string): string => {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  };
}
