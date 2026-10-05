import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { UserRole } from '../domain/model/value-object/user-role';

export interface UserResource extends BaseResource {
  id: number;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface UsersResponse extends BaseResponse {
  users: UserResource[];
}
