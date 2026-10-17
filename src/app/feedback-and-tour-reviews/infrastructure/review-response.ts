
import {
  BaseResource,
  BaseResponse
} from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a review.
 */
export interface ReviewResource extends BaseResource {
  id: number;
  userId: number;
  tourId: number;
  rating: number;
  createdAt: string;
}

/**
 * Response envelope for review collection queries.
 */
export interface ReviewsResponse extends BaseResponse {
  reviews: ReviewResource[];
}
