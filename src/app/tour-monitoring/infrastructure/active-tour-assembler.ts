import {ActiveTourResource, ActiveToursResponse} from './active-tours-response';
import {ActiveTour} from '../domain/model/active-tour.entity';
import {BaseAssembler} from '../../shared/infrastructure/base-assembler';

/**
 * Maps activeTours entities to and from API resources.
 */
export class ActiveTourAssembler implements BaseAssembler<ActiveTour, ActiveTourResource, ActiveToursResponse> {
  private parseId(value: number | string | undefined, field: string): number {
    const id = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
      throw new Error(`Active tour has an invalid ${field}`);
    }
    return id;
  }

  /**
   * Converts a ActiveToursResponse to an array of ActiveToursEntity entities.
   * @param response - The API response containing activeTours.
   * @returns An array of ActiveToursEntity entities.
   */
  toEntitiesFromResponse = (response: ActiveToursResponse): ActiveTour[] =>
    response.activeTours.map(resource => this.toEntityFromResource(resource));

  /**
   * Converts a ActiveToursResource to a ActiveToursEntity entity.
   * @param resource - The resource to convert.
   * @returns The converted ActiveToursEntity entity.
   */
  toEntityFromResource = (resource: ActiveTourResource): ActiveTour => {
    const finishedAt = resource.finishedAt ?? null;
    const guideId = resource.tourGuideId ?? resource.guideId;
    return new ActiveTour({
      id: this.parseId(resource.id, 'id'),
      tourScheduleId: this.parseId(resource.tourScheduleId, 'tourScheduleId'),
      guideId: this.parseId(guideId, 'tourGuideId'),
      status: resource.status || (finishedAt ? 'FINISHED' : 'IN_PROGRESS'),
      currentLatitude: resource.currentLatitude,
      currentLongitude: resource.currentLongitude,
      startedAt: resource.startedAt,
      finishedAt,
    });
  };


  /**
   * Converts a ActiveToursEntity entity to a ActiveToursResource.
   * @param entity - The entity to convert.
   * @returns The converted ActiveToursResource.
   */
  toResourceFromEntity = (entity: ActiveTour): ActiveTourResource =>
    ({
      id: entity.id,
      tourScheduleId: entity.tourScheduleId,
      tourGuideId: entity.guideId,
      status: entity.status,
      currentLatitude: entity.currentLatitude,
      currentLongitude: entity.currentLongitude,
      startedAt: entity.startedAt,
      finishedAt: entity.finishedAt,
    });

}
