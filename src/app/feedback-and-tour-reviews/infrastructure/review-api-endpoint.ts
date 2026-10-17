
import { HttpClient } from '@angular/common/http';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Review } from '../domain/model/aggregates/review.entity';
import { ReviewResource, ReviewsResponse } from './review-response';
import { ReviewAssembler } from './review-assembler';
import { environment } from '../../../environments/environment';

/**
 * Endpoint client for review CRUD operations.
 */
export class ReviewApiEndpoint extends BaseApiEndpoint<
  Review,
  ReviewResource,
  ReviewsResponse,
  ReviewAssembler
> {

  constructor(http: HttpClient) {
    super(
      http,
      `${environment.reviewsApiBaseUrl}/reviews`,
      new ReviewAssembler()
    );
  }
}
