import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Profile } from '../domain/model/profile.entity';
import { ProfileRole } from '../domain/model/profile-role';
import { ProfileResource, ProfilesResponse } from './profile-response';

export class ProfileAssembler implements BaseAssembler<Profile, ProfileResource, ProfilesResponse> {
  toEntityFromResource(resource: ProfileResource): Profile {
    const role = resource.role === 'AGENCY_OWNER' ? ProfileRole.AGENCY : resource.role;

    if (!Object.values(ProfileRole).includes(role)) {
      throw new Error(`Unsupported profile role: ${resource.role}`);
    }

    return new Profile({
      id: resource.id,
      userId: resource.userId === undefined ? resource.id : Number(resource.userId),
      firstName: resource.firstName,
      lastName: resource.lastName,
      email: resource.email,
      role,
    });
  }

  toResourceFromEntity(entity: Profile): ProfileResource {
    return {
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      role: entity.role === ProfileRole.AGENCY ? 'AGENCY_OWNER' : entity.role,
    };
  }

  toEntitiesFromResponse(response: ProfilesResponse): Profile[] {
    return response.users.map((resource) => this.toEntityFromResource(resource));
  }
}
