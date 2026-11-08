import { HttpClient } from '@angular/common/http';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { Comment } from '../domain/model/aggregates/comment.entity';

import { CommentResource, CommentsResponse } from './comment-response';

import { CommentAssembler } from './comment-assembler';

import { environment } from '../../../environments/environment';

/**
 * Clase que configura la comunicación con la API de comentarios.
 *
 * Hereda las operaciones CRUD de BaseApiEndpoint.
 */
export class CommentApiEndpoint extends BaseApiEndpoint<
  Comment,
  CommentResource,
  CommentsResponse,
  CommentAssembler
> {
  /**
   * Inicializa el endpoint de comentarios.
   *
   * @param http Cliente HTTP de Angular.
   */
  constructor(http: HttpClient) {
    // Obtenemos la dirección base configurada en environment.
    const endpointUrl = `${environment.commentsApiBaseUrl}/comments`;

    // Enviamos a la clase padre el cliente HTTP,
    // la URL de la API y el assembler de comentarios.
    super(http, endpointUrl, new CommentAssembler());
  }
}
