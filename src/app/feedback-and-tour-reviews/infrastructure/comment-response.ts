
import {
  BaseResource,
  BaseResponse
} from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a comment.
 */
export interface CommentResource extends BaseResource {
  id: number;
  reviewId: number;
  content: string;
  createdAt: string;
}

/**
 * Response envelope for comment collection queries.
 */
export interface CommentsResponse extends BaseResponse {
  comments: CommentResource[];
}
