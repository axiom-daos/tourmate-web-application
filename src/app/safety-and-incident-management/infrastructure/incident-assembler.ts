import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Incident } from '../domain/model/aggregates/incident.entity';
import { IncidentResource, IncidentsResponse } from './incident-response';
import { IncidentStatus } from '../domain/model/value-object/incident-status';

/**
 * Maps incident entities to and from API resources.
 */
export class IncidentAssembler implements BaseAssembler<
  Incident,
  IncidentResource,
  IncidentsResponse
> {
  toEntitiesFromResponse = (response: IncidentsResponse | IncidentResource[]): Incident[] => {
    const resources = Array.isArray(response) ? response : (response.incidents ?? []);
    return resources.map((resource) => this.toEntityFromResource(resource));
  };

  toEntityFromResource = (resource: IncidentResource): Incident =>
    new Incident({
      id: Number(resource.id),
      uuid: resource.uuid ?? '',
      activeTourId: Number(resource.activeTourId),
      reportedByUserId: Number(resource.reportedByUserId),
      description: resource.description,
      latitude: Number(resource.latitude),
      longitude: Number(resource.longitude),
      reportedAt: resource.reportedAt,
      status: resource.status as IncidentStatus,
      severity: (resource as any).severity ?? 'MEDIUM',
      isSynced: true,
    });

  toResourceFromEntity = (entity: Incident): IncidentResource =>
    ({
      id: entity.id,
      uuid: entity.uuid,
      activeTourId: entity.activeTourId,
      reportedByUserId: entity.reportedByUserId,
      description: entity.description,
      latitude: entity.latitude,
      longitude: entity.longitude,
      reportedAt: entity.reportedAt,
      status: entity.status.toString(),
      severity: entity.severity,
    }) as IncidentResource;
}
