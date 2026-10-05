import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { TourGuide } from '../domain/model/tour-guide.entity';
import { TourGuideResource, TourGuidesResponse } from './tour-guide-response';

export class TourGuideAssembler
  implements BaseAssembler<TourGuide, TourGuideResource, TourGuidesResponse>
{
  toEntityFromResource(resource: TourGuideResource): TourGuide {
    return new TourGuide({
      id: resource.id,
      userId: resource.userId,
      agencyId: resource.agencyId,
      languages: resource.languages,
      phoneNumber: resource.phoneNumber,
    });
  }

  toResourceFromEntity(entity: TourGuide): TourGuideResource {
    return {
      id: entity.id,
      userId: entity.userId,
      agencyId: entity.agencyId,
      languages: entity.languages,
      phoneNumber: entity.phoneNumber,
    };
  }

  toEntitiesFromResponse(response: TourGuidesResponse): TourGuide[] {
    return response.tourGuides.map((resource) => this.toEntityFromResource(resource));
  }
}
