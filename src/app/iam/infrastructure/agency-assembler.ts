import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Agency } from '../domain/model/agency.entity';
import { AgenciesResponse, AgencyResource } from './agency-response';

export class AgencyAssembler implements BaseAssembler<Agency, AgencyResource, AgenciesResponse> {
  toEntityFromResource(resource: AgencyResource): Agency {
    return new Agency({
      id: resource.id,
      ownerId: resource.ownerId,
      businessName: resource.businessName,
      description: resource.description,
      phone: resource.phone,
      contactEmail: resource.contactEmail,
      website: resource.website,
      address: resource.address,
    });
  }

  toResourceFromEntity(entity: Agency): AgencyResource {
    return {
      id: entity.id,
      ownerId: entity.ownerId,
      businessName: entity.businessName,
      description: entity.description,
      phone: entity.phone,
      contactEmail: entity.contactEmail,
      website: entity.website,
      address: entity.address,
    };
  }

  toEntitiesFromResponse(response: AgenciesResponse): Agency[] {
    return response.agencies.map((resource) => this.toEntityFromResource(resource));
  }
}
