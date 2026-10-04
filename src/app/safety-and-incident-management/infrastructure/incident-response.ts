import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of an incident.
 */
export interface IncidentResource extends BaseResource {
  id: number;
  uuid: string;
  activeTourId: number;
  reportedByUserId: number;
  description: string;
  latitude: number;
  longitude: number;
  reportedAt: string;
  status: string;
}

/**
 * Response envelope for incident collection queries.
 */
export interface IncidentsResponse extends BaseResponse {
  incidents: IncidentResource[];
}
