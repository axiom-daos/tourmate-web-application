import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface TourGuideResource extends BaseResource {
  id: number;
  userId: number;
  agencyId: number;
  languages: string[];
  phoneNumber: string;
}

export interface TourGuidesResponse extends BaseResponse {
  tourGuides: TourGuideResource[];
}
