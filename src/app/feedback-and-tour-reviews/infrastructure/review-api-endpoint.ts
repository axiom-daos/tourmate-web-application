import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { Review } from '../domain/model/aggregates/review.entity';

import { ReviewResource, ReviewsResponse } from './review-response';

import { ReviewAssembler } from './review-assembler';

import { environment } from '../../../environments/environment';

/**
 * Clase que configura la comunicación con la API de reseñas.
 *
 * Hereda las operaciones CRUD de BaseApiEndpoint.
 */
export class ReviewApiEndpoint extends BaseApiEndpoint<
  Review,
  ReviewResource,
  ReviewsResponse,
  ReviewAssembler
> {
  /**
   * Inicializa el endpoint de reseñas.
   *
   * @param http Cliente HTTP de Angular.
   */
  constructor(http: HttpClient) {
    // Obtenemos la dirección base configurada en environment.
    const endpointUrl = `${environment.tourmateProviderApiBaseUrl}/reviews`;

    // Enviamos a la clase padre el cliente HTTP,
    // la URL de la API y el assembler de reseñas.
    super(http, endpointUrl, new ReviewAssembler());
  }

  override create(review: Review): Observable<Review> {
    const payload = {
      userId: Number(review.userId),
      tourId: Number(review.tourId),
      rating: Number(review.rating),
    };
    return this.http.post<ReviewResource>(this.endpointUrl, payload).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create review')),
    );
  }

  getByTourId(tourId: number): Observable<Review[]> {
    const url = `${this.endpointUrl}/tour/${tourId}`;
    return this.http.get<ReviewsResponse | ReviewResource[]>(url).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map((resource) => this.assembler.toEntityFromResource(resource));
        }
        return this.assembler.toEntitiesFromResponse(response);
      }),
      catchError(this.handleError('Failed to fetch reviews for tour')),
    );
  }
}
