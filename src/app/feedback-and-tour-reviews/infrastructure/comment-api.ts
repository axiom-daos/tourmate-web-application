
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';
import { Comment } from '../domain/model/aggregates/comment.entity';
import { CommentApiEndpoint } from './comment-api-endpoint';

/**
 * Infrastructure facade for comment CRUD operations.
 */
@Injectable({
  providedIn: 'root'
})
export class CommentApi extends BaseApi {

  private readonly http = inject(HttpClient);

  private readonly commentsEndpoint =
    new CommentApiEndpoint(this.http);

  // Obtenemos todos los comentarios
  getComments(): Observable<Comment[]> {
    return this.commentsEndpoint.getAll();
  }

  // Obtenemos un comentario por su ID
  getComment(id: number): Observable<Comment> {
    return this.commentsEndpoint.getById(id);
  }

  // Creamos un nuevo comentario
  createComment(comment: Comment): Observable<Comment> {
    return this.commentsEndpoint.create(comment);
  }

  // Actualizamos un comentario existente
  updateComment(comment: Comment): Observable<Comment> {
    return this.commentsEndpoint.update(
      comment,
      comment.id
    );
  }

  // Eliminamos un comentario por su ID
  deleteComment(id: number): Observable<void> {
    return this.commentsEndpoint.delete(id);
  }
}
