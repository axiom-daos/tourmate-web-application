import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Incident } from '../domain/model/aggregates/incident.entity';
import { IncidentStatus } from '../domain/model/value-object/incident-status';

@Injectable({
  providedIn: 'root',
})
export class IncidentStore {
  private http = inject(HttpClient);
  private readonly OFFLINE_STORAGE_KEY = 'tourmate_offline_incidents';
  private readonly API_URL = '/api/v1/incidents';

  private incidentsSignal = signal<Incident[]>(this.loadFromStorage());
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly incidents = this.incidentsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly pendingSyncIncidents = computed(() =>
    this.incidentsSignal().filter((inc) => !inc.isSynced),
  );

  readonly incidentCount = computed(() => this.incidentsSignal().length);

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
      localStorage.setItem(this.OFFLINE_STORAGE_KEY, JSON.stringify(incidents));
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
    };

    this.http.post<any>(this.API_URL, payload).subscribe({
      next: (response) => {
        const current = this.incidentsSignal();
        const synced = current.map((inc) => {
          if (inc.uuid === incident.uuid || inc.id === incident.id) {
            return new Incident({
              id: response.id ?? inc.id,
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
            });
          }
          return inc;
        });
        this.incidentsSignal.set(synced);
        this.saveToStorage(synced);
      },
      error: (err) => {
        console.warn('Network unavailable, incident kept offline in queue.', err);
      },
    });
  }

  public updateIncident(incident: Incident) {
    const current = this.incidentsSignal();
    const updated = current.map((inc) =>
      inc.id === incident.id || inc.uuid === incident.uuid ? incident : inc,
    );
    this.incidentsSignal.set(updated);
    this.saveToStorage(updated);
  }

  public resolveIncident(incident: Incident) {
    incident.resolve();
    this.updateIncident(incident);
  }

  public deleteIncident(id: number) {
    const current = this.incidentsSignal();
    const filtered = current.filter((inc) => inc.id !== id);
    this.incidentsSignal.set(filtered);
    this.saveToStorage(filtered);
  }

  public syncOfflineIncidents() {
    const pending = this.pendingSyncIncidents();
    pending.forEach((incident) => {
      const payload = {
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
      };

      this.http.post<any>(this.API_URL, payload).subscribe({
        next: (response) => {
          const current = this.incidentsSignal();
          const synced = current.map((inc) => {
            if (inc.uuid === incident.uuid || inc.id === incident.id) {
              return new Incident({
                id: response.id ?? inc.id,
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
              });
            }
            return inc;
          });
          this.incidentsSignal.set(synced);

          const remainingPending = synced.filter((inc) => !inc.isSynced);
          this.saveToStorage(remainingPending);
        },
        error: (err) => {
          console.warn('Sync burst failed for incident:', incident.uuid, err);
        },
      });
    });
  }
}
