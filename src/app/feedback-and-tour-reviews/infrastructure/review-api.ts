import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';
import { Review } from '../domain/model/aggregates/review.entity';
import { ReviewApiEndpoint } from './review-api-endpoint';

/**
 * Infrastructure service responsible for
 * communicating with the Reviews REST API.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
@Injectable({
  providedIn: 'root',
})
export class ReviewApi extends BaseApi {
  private readonly http = inject(HttpClient);

  private readonly reviewsEndpoint = new ReviewApiEndpoint(this.http);

  /**
   * Validates an identifier before making
   * a request to the API.
   */
  private isValidId(id: number): boolean {
    return Number.isSafeInteger(id) && id > 0;
  }

  /**
   * Retrieves all reviews.
   */
  getReviews(): Observable<Review[]> {
    return this.reviewsEndpoint.getAll();
  }

  /**
   * Retrieves a review by its identifier.
   */
  getReview(id: number): Observable<Review> {
    if (!this.isValidId(id)) {
      return throwError(() => new Error('El identificador de la reseña es inválido.'));
    }

    return this.reviewsEndpoint.getById(id);
  }

  /**
   * Creates a new review.
   */
  createReview(review: Review): Observable<Review> {
    return this.reviewsEndpoint.create(review);
  }

  /**
   * Updates an existing review.
   */
  updateReview(review: Review): Observable<Review> {
    if (!this.isValidId(review.id)) {
      return throwError(() => new Error('No se puede actualizar una reseña sin ID válido.'));
    }

    return this.reviewsEndpoint.update(review, review.id);
  }

  /**
   * Deletes a review by its identifier.
   */
  deleteReview(id: number): Observable<void> {
    if (!this.isValidId(id)) {
      return throwError(() => new Error('No se puede eliminar una reseña sin ID válido.'));
    }

    return this.reviewsEndpoint.delete(id);
  }
}
