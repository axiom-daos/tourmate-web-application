import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {TourGuide} from '../domain/model/tour-guide.entity';
import {TourGuidesResponse, TourGuideResource} from './tour-guides-response';

/**
 * Maps tour-guide entities to and from API resources.
 */
export class TourGuideAssembler implements BaseAssembler<TourGuide, TourGuideResource, TourGuidesResponse> {

  /**
   * Converts a TourGuidesResponse to an array of TourGuide entities.
   * @param response - The API response containing tour-guides.
   * @returns An array of TourGuide entities.
   */
  toEntitiesFromResponse = (response: TourGuidesResponse): TourGuide[] =>
    response.tourGuides.map(resource => this.toEntityFromResource(resource as TourGuideResource));

  /**
   * Converts a TourGuideResource to a TourGuide entity.
   * @param resource - The resource to convert.
   * @returns The converted TourGuide entity.
   */
  toEntityFromResource = (resource: TourGuideResource): TourGuide =>
    new TourGuide({
      id: resource.id,
      userId: resource.userId,
      agencyId: resource.agencyId,
      languages: resource.languages,
      phoneNumber: resource.phoneNumber
    });

  /**
   * Converts a TourGuide entity to a TourGuideResource.
   * @param entity - The entity to convert.
   * @returns The converted TourGuideResource.
   */
  toResourceFromEntity = (entity: TourGuide): TourGuideResource =>
    ({
      id: entity.id,
      userId: entity.userId,
      agencyId: entity.agencyId,
      languages: entity.languages,
      phoneNumber: entity.phoneNumber
    } as TourGuideResource);


}
