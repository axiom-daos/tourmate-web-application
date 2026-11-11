import { HttpClient } from '@angular/common/http';

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
}
