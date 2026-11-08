import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Represents a comment resource received from
 * or sent to the Comments REST API.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
export interface CommentResource extends BaseResource {
  /** Unique comment identifier */
  id: number;

  /** Review associated with the comment */
  reviewId: number | string;

  /** Text content of the comment */
  content: string;

  /** Date when the comment was created */
  createdAt: string;
}

/**
 * Represents a collection response
 * containing multiple comments.
 */
export interface CommentsResponse extends BaseResponse {
  /** List of comment resources */
  comments: CommentResource[];
}
