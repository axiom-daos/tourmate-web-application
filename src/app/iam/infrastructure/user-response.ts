import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface UserResource extends BaseResource {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface UsersResponse extends BaseResponse {
  users: UserResource[];
}
