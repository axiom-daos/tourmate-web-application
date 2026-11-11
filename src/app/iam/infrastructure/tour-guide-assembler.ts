import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { TourGuide } from '../domain/model/tour-guide.entity';
import { TourGuideResource, TourGuidesResponse } from './tour-guide-response';

export class TourGuideAssembler
  implements BaseAssembler<TourGuide, TourGuideResource, TourGuidesResponse>
{
  private parseId(value: number | string, field: string): number {
    const id = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
      throw new Error(`El campo ${field} contiene un identificador inválido.`);
    }
    return id;
  }

  toEntityFromResource(resource: TourGuideResource): TourGuide {
    return new TourGuide({
      id: this.parseId(resource.id, 'id'),
      userId: this.parseId(resource.userId, 'userId'),
      agencyId: this.parseId(resource.agencyId, 'agencyId'),
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
