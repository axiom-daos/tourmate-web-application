import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { User } from '../domain/model/user.entity';
import { UserRole } from '../domain/model/value-object/user-role';
import { UserResource, UsersResponse } from './user-response';

export class UserAssembler implements BaseAssembler<User, UserResource, UsersResponse> {
  toEntityFromResource(resource: UserResource): User {
    if (!Object.values(UserRole).includes(resource.role)) {
      throw new Error(`Unsupported user role: ${resource.role}`);
    }

    return new User({
      id: resource.id,
      email: resource.email,
      role: resource.role,
      firstName: resource.firstName,
      lastName: resource.lastName,
    });
  }

  toResourceFromEntity(entity: User): UserResource {
    return {
      id: entity.id,
      email: entity.email,
      role: entity.role,
      firstName: entity.firstName,
      lastName: entity.lastName,
    };
  }

  toEntitiesFromResponse(response: UsersResponse): User[] {
    return response.users.map((resource) => this.toEntityFromResource(resource));
  }
}
