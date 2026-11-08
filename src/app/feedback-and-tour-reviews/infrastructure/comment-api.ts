import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';
import { Comment } from '../domain/model/aggregates/comment.entity';
import { CommentApiEndpoint } from './comment-api-endpoint';

/**
 * Infrastructure service responsible for
 * communicating with the Comments REST API.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
@Injectable({
  providedIn: 'root',
})
export class CommentApi extends BaseApi {
  private readonly http = inject(HttpClient);

  private readonly commentsEndpoint = new CommentApiEndpoint(this.http);

  /**
   * Validates an identifier before making
   * a request to the API.
   */
  private isValidId(id: number): boolean {
    return Number.isSafeInteger(id) && id > 0;
  }

  /**
   * Retrieves all comments.
   */
  getComments(): Observable<Comment[]> {
    return this.commentsEndpoint.getAll();
  }

  /**
   * Retrieves a comment by its identifier.
   */
  getComment(id: number): Observable<Comment> {
    if (!this.isValidId(id)) {
      return throwError(() => new Error('El identificador del comentario es inválido.'));
    }

    return this.commentsEndpoint.getById(id);
  }

  /**
   * Creates a new comment.
   */
  createComment(comment: Comment): Observable<Comment> {
    if (!this.isValidId(comment.reviewId)) {
      return throwError(() => new Error('El comentario debe pertenecer a una reseña válida.'));
    }

    return this.commentsEndpoint.create(comment);
  }

  /**
   * Updates an existing comment.
   */
  updateComment(comment: Comment): Observable<Comment> {
    if (!this.isValidId(comment.id)) {
      return throwError(() => new Error('No se puede actualizar un comentario sin ID válido.'));
    }

    return this.commentsEndpoint.update(comment, comment.id);
  }

  /**
   * Deletes a comment by its identifier.
   */
  deleteComment(id: number): Observable<void> {
    if (!this.isValidId(id)) {
      return throwError(() => new Error('No se puede eliminar un comentario sin ID válido.'));
    }

    return this.commentsEndpoint.delete(id);
  }
}
