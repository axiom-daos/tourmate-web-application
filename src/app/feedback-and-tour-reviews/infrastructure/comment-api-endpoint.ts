
import { HttpClient } from '@angular/common/http';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Comment } from '../domain/model/aggregates/comment.entity';
import {
  CommentResource,
  CommentsResponse
} from './comment-response';
import { CommentAssembler } from './comment-assembler';
import { environment } from '../../../environments/environment';

/**
 * Endpoint client for comment CRUD operations.
 */
export class CommentApiEndpoint extends BaseApiEndpoint<
  Comment,
  CommentResource,
  CommentsResponse,
  CommentAssembler
> {

  constructor(http: HttpClient) {
    super(
      http,
      `${environment.commentsApiBaseUrl}/comments`,
      new CommentAssembler()
    );
  }
}
