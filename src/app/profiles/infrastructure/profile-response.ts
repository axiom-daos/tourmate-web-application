import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { ProfileRole } from '../domain/model/profile-role';

export interface ProfileResource extends BaseResource {
  id: number;
  userId?: number | string;
  firstName: string;
  lastName: string;
  email: string;
  role: ProfileRole | 'AGENCY_OWNER';
}

export interface ProfilesResponse extends BaseResponse {
  users: ProfileResource[];
}
