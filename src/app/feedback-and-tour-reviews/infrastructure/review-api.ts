
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';
import { Review } from '../domain/model/aggregates/review.entity';
import { ReviewApiEndpoint } from './review-api-endpoint';

/**
 * Infrastructure facade for review endpoint operations.
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewApi extends BaseApi {

  private readonly http = inject(HttpClient);
  private readonly reviewsEndpoint =
    new ReviewApiEndpoint(this.http);

  // Obtenemos todas las reseñas
  getReviews(): Observable<Review[]> {
    return this.reviewsEndpoint.getAll();
  }

  // Obtenemos una reseña por su ID
  getReview(id: number): Observable<Review> {
    return this.reviewsEndpoint.getById(id);
  }

  // Creamos una nueva reseña
  createReview(review: Review): Observable<Review> {
    return this.reviewsEndpoint.create(review);
  }

  // Actualizamos una reseña existente
  updateReview(review: Review): Observable<Review> {
    return this.reviewsEndpoint.update(review, review.id);
  }

  // Eliminamos una reseña por su ID
  deleteReview(id: number): Observable<void> {
    return this.reviewsEndpoint.delete(id);
  }
}
