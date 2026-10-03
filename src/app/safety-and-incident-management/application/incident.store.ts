import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { Incident } from '../domain/model/aggregates/incident.entity';
import { IncidentApi } from '../infrastructure/incident-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';

/**
 * Holds incident application state and coordinates incident-related application layer behavior.
 */
@Injectable({
  providedIn: 'root',
})
export class IncidentStore {
  private readonly incidentApi = inject(IncidentApi);

  /**
   * Computed signal for the count of incidents.
   */
  readonly incidentCount = computed(() => this.incidents().length);

  private readonly incidentsSignal = signal<Incident[]>([]);

  /**
   * Readonly signal for the list of incidents.
   */
  readonly incidents = this.incidentsSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);

  /**
   * Readonly signal indicating if data is loading.
   */
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);

  /**
   * Readonly signal for the current error message.
   */
  readonly error = this.errorSignal.asReadonly();

  /**
   * Creates an instance of IncidentStore and loads initial data.
   */
  constructor() {
    this.loadIncidents();
  }

  /**
   * Selects an incident by identifier.
   * @param id - Incident identifier.
   * @returns Reactive selection for the requested incident.
   */
  getIncidentById = (id: number): Signal<Incident | undefined> =>
    computed(() => (id ? this.incidents().find((i) => i.id === id) : undefined));

  /**
   * Adds a new incident.
   * @param incident - The incident to add.
   */
  addIncident = (incident: Incident): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.incidentApi
      .createIncident(incident)
      .pipe(retry(2))
      .subscribe({
        next: (createdIncident) => {
          this.incidentsSignal.update((incidents) => [...incidents, createdIncident]);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to create incident'));
          this.loadingSignal.set(false);
        },
      });
  };

  /**
   * Updates an existing incident.
   * @param updatedIncident - The incident to update.
   */
  updateIncident = (updatedIncident: Incident): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
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

  /**
   * Resolves an incident (domain business behavior wrapper).
   * @param incident - The incident to resolve.
   */
  resolveIncident = (incident: Incident): void => {
    incident.resolve();
    this.updateIncident(incident);
  };

  /**
   * Deletes an incident by ID.
   * @param id - The ID of the incident to delete.
   */
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
   * Loads all incidents from the API.
   */
  private loadIncidents = (): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.incidentApi
      .getCourses()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (incidents) => {
          this.incidentsSignal.set(incidents);
          this.loadingSignal.set(false);
          this.errorSignal.set(null);
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load incidents'));
          this.loadingSignal.set(false);
        },
      });
  };

  /**
   * Normalizes unknown errors into a display-friendly message.
   * @param error - Source error.
   * @param fallback - Default message when details are unavailable.
   * @returns Normalized message.
   */
  private formatError = (error: unknown, fallback: string): string => {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  };
}
