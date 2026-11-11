import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Represents a review resource received from
 * or sent to the Reviews REST API.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
export interface ReviewResource extends BaseResource {
  /** Unique review identifier */
  id: number;

  /** User who created the review */
  userId: number | string;

  /** Tour associated with the review */
  tourId: number | string;

  /** Rating between 1 and 5 */
  rating: number | string;

  /** Date when the review was created */
  createdAt: string;
}

/**
 * Represents a collection response
 * containing multiple reviews.
 */
export interface ReviewsResponse extends BaseResponse {
  /** List of review resources */
  reviews: ReviewResource[];
}
