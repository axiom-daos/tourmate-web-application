import {ActiveToursResource, ActiveToursResponse} from './active-tours-response';
import {ActiveTours} from '../domain/model/active-tours.entity';
import {BaseAssembler} from '../../shared/infrastructure/base-assembler';

/**
 * Maps activeTours entities to and from API resources.
 */
export class ActiveToursAssembler implements BaseAssembler<ActiveTours, ActiveToursResource, ActiveToursResponse> {
  /**
   * Converts a ActiveToursResponse to an array of ActiveToursEntity entities.
   * @param response - The API response containing activeTours.
   * @returns An array of ActiveToursEntity entities.
   */
  toEntitiesFromResponse = (response: ActiveToursResponse): ActiveTours[] => {
    console.log(response);
    return response.activeTours.map(resource => this.toEntityFromResource(resource as ActiveToursResource));
  };

  /**
   * Converts a ActiveToursResource to a ActiveToursEntity entity.
   * @param resource - The resource to convert.
   * @returns The converted ActiveToursEntity entity.
   */
  toEntityFromResource = (resource: ActiveToursResource): ActiveTours =>
    new ActiveTours({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      categoryId: resource.categoryId
    });


  /**
   * Converts a ActiveToursEntity entity to a ActiveToursResource.
   * @param entity - The entity to convert.
   * @returns The converted ActiveToursResource.
   */
  toResourceFromEntity = (entity: ActiveTours): ActiveToursResource =>
    ({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      categoryId: entity.categoryId
    } as ActiveToursResource);

}
