import { inject, Injectable } from '@angular/core';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Incident } from '../domain/model/aggregates/incident.entity';
import { HttpClient } from '@angular/common/http';
import { IncidentApiEndpoint } from './incident-api-endpoint';
import { Observable } from 'rxjs';

/**
 * Infrastructure facade for incident endpoint operations.
 */
@Injectable({ providedIn: 'root' })
export class IncidentApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly incidentsEndpoint = new IncidentApiEndpoint(this.http);

  getCourses = (): Observable<Incident[]> => this.incidentsEndpoint.getAll();

  getIncident = (id: number): Observable<Incident> => this.incidentsEndpoint.getById(id);

  createIncident = (incident: Incident): Observable<Incident> =>
    this.incidentsEndpoint.create(incident);

  updateIncident = (incident: Incident): Observable<Incident> =>
    this.incidentsEndpoint.update(incident, incident.id);

  deleteIncident = (id: number): Observable<void> => this.incidentsEndpoint.delete(id);
}
