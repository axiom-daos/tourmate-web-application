import {ActiveTourResource, ActiveToursResponse} from './active-tours-response';
import {ActiveTour} from '../domain/model/active-tour.entity';
import {BaseAssembler} from '../../shared/infrastructure/base-assembler';

/**
 * Maps activeTours entities to and from API resources.
 */
export class ActiveTourAssembler implements BaseAssembler<ActiveTour, ActiveTourResource, ActiveToursResponse> {
  /**
   * Converts a ActiveToursResponse to an array of ActiveToursEntity entities.
   * @param response - The API response containing activeTours.
   * @returns An array of ActiveToursEntity entities.
   */
  toEntitiesFromResponse = (response: ActiveToursResponse): ActiveTour[] => {    console.log(response);
    return response.activeTours.map(resource => this.toEntityFromResource(resource as ActiveTourResource));
  };

  /**
   * Converts a ActiveToursResource to a ActiveToursEntity entity.
   * @param resource - The resource to convert.
   * @returns The converted ActiveToursEntity entity.
   */
  toEntityFromResource = (resource: ActiveTourResource): ActiveTour =>
    new ActiveTour({
      id: resource.id,
      tourScheduleId: resource.tourScheduleId,
      guideId: resource.guideId,
      status: resource.status,
      currentLatitude: resource.currentLatitude,
      currentLongitude: resource.currentLongitude,
      startedAt: resource.startedAt,
      finishedAt: resource.finishedAt,
    });


  /**
   * Converts a ActiveToursEntity entity to a ActiveToursResource.
   * @param entity - The entity to convert.
   * @returns The converted ActiveToursResource.
   */
  toResourceFromEntity = (entity: ActiveTour): ActiveTourResource =>
    ({
      id: entity.id,
      tourScheduleId: entity.tourScheduleId,
      guideId: entity.guideId,
      status: entity.status,
      currentLatitude: entity.currentLatitude,
      currentLongitude: entity.currentLongitude,
      startedAt: entity.startedAt,
      finishedAt: entity.finishedAt

    } as ActiveTourResource);

}
