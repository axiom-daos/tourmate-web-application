import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface AgencyResource extends BaseResource {
  id: number;
  ownerId: number;
  businessName: string;
  description: string;
  phone: string;
  contactEmail: string;
  website: string;
  address: string;
}

export interface AgenciesResponse extends BaseResponse {
  agencies: AgencyResource[];
}
