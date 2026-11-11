import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { User } from '../domain/model/user.entity';
import { UserRole } from '../domain/model/value-object/user-role';
import { UserResource, UsersResponse } from './user-response';

export class UserAssembler implements BaseAssembler<User, UserResource, UsersResponse> {
  private parseId(value: number | string, field: string): number {
    const id = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
      throw new Error(`El campo ${field} contiene un identificador inválido.`);
    }
    return id;
  }

  private parseRole(role: string): UserRole {
    switch (role) {
      case 'ADMIN':
      case UserRole.ADMIN:
        return UserRole.ADMIN;
      case 'AGENCY_OWNER':
      case UserRole.AGENCY_OWNER:
        return UserRole.AGENCY_OWNER;
      case 'GUIDE':
      case 'TOUR_GUIDE':
      case UserRole.GUIDE:
        return UserRole.GUIDE;
      case 'TOURIST':
      case 'USER':
      case UserRole.TOURIST:
        return UserRole.TOURIST;
      default:
        throw new Error(`Unsupported user role: ${role}`);
    }
  }

  private serializeRole(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'ADMIN';
      case UserRole.AGENCY_OWNER:
        return 'AGENCY_OWNER';
      case UserRole.GUIDE:
        return 'GUIDE';
      case UserRole.TOURIST:
        return 'TOURIST';
    }
  }

  toEntityFromResource(resource: UserResource): User {
    return new User({
      id: this.parseId(resource.id, 'id'),
      email: resource.email,
      role: this.parseRole(resource.role),
      firstName: resource.firstName,
      lastName: resource.lastName,
    });
  }

  toResourceFromEntity(entity: User): UserResource {
    return {
      id: entity.id,
      email: entity.email,
      role: this.serializeRole(entity.role),
      firstName: entity.firstName,
      lastName: entity.lastName,
    };
  }

  toEntitiesFromResponse(response: UsersResponse): User[] {
    return response.users.map((resource) => this.toEntityFromResource(resource));
  }
}
