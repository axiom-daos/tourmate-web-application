import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Incident } from '../domain/model/aggregates/incident.entity';
import { IncidentResource, IncidentsResponse } from './incident-response';
import { IncidentAssembler } from './incident-assembler';
import { HttpClient } from '@angular/common/http';
import {environment} from '../../../environments/environment';


/**
 * Endpoint client for incident CRUD operations.
 */
export class IncidentApiEndpoint extends BaseApiEndpoint<
  Incident,
  IncidentResource,
  IncidentsResponse,
  IncidentAssembler
> {
  constructor(http: HttpClient) {
    super(http, `${environment.incidentsApiBaseUrl}/incidents`, new IncidentAssembler());
  }
}
