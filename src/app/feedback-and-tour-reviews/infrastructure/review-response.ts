import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface ReviewResource extends BaseResource {
  id: number;
  userId: number;
  tourId: number;
  rating: number;
  createdAt: string;
}

export interface ReviewsResponse extends BaseResponse {
  reviews: ReviewResource[];
}
