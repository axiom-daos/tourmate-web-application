
import {
  Injectable,
  inject,
  signal,
  computed
} from '@angular/core';

import {
  Observable,
  forkJoin,
  of,
  switchMap,
  map,
  tap,
  catchError,
  throwError,
  finalize
} from 'rxjs';

import { Review } from '../domain/model/aggregates/review.entity';
import { Comment } from '../domain/model/aggregates/comment.entity';
import { ReviewApi } from '../infrastructure/review-api';
import { CommentApi } from '../infrastructure/comment-api';

export interface ReviewItem {
  id: number;
  userId: number;
  tourId: number;
  rating: number;
  createdAt: string;
  commentId: number | null;
  comment: string;
}

export interface ReviewInput {
  id?: number;
  userId: number;
  tourId: number;
  rating: number;
  comment: string;
  commentId?: number | null;
  createdAt?: string;
}

/**
 * Manages review and comment application state.
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewStore {

  private readonly reviewApi = inject(ReviewApi);
  private readonly commentApi = inject(CommentApi);

  // Estado privado
  private readonly reviewsSignal = signal<ReviewItem[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // Estado público
  readonly reviews = this.reviewsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly reviewCount = computed(
    () => this.reviews().length
  );

  // READ: Cargamos reseñas y comentarios
  loadData(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    forkJoin({
      reviews: this.reviewApi.getReviews(),
      comments: this.commentApi.getComments()
    }).pipe(
      finalize(() => this.loadingSignal.set(false))
    ).subscribe({
      next: ({ reviews, comments }) => {
        const result = reviews.map(review =>
          this.mapReview(review, comments)
        );

        this.reviewsSignal.set(result);
      },
      error: (error: unknown) => {
        this.setError(error, 'Error al cargar las reseñas');
      }
    });
  }

  // Relacionamos una reseña con su comentario
  private mapReview(
    review: Review,
    comments: Comment[]
  ): ReviewItem {

    const comment = comments.find(
      item => Number(item.reviewId) === Number(review.id)
    );

    return {
      id: Number(review.id),
      userId: Number(review.userId),
      tourId: Number(review.tourId),
      rating: Number(review.rating),
      createdAt: review.createdAt,
      commentId: comment ? Number(comment.id) : null,
      comment: comment?.content ?? ''
    };
  }

  // READ: Buscamos una reseña en el estado
  getReviewById(id: number) {
    return computed(() =>
      this.reviews().find(
        review => review.id === Number(id)
      )
    );
  }

  // READ: Consultamos una reseña desde la API
  getReview(id: number): Observable<Review> {
    return this.reviewApi.getReview(id);
  }

  // CREATE: Creamos una reseña y su comentario
  addReview(input: ReviewInput): Observable<ReviewItem> {
    this.errorSignal.set(null);
    this.loadingSignal.set(true);

    const createdAt =
      input.createdAt ?? new Date().toISOString();

    const review = new Review({
      id: 0,
      userId: Number(input.userId),
      tourId: Number(input.tourId),
      rating: Number(input.rating),
      createdAt
    });

    return this.reviewApi.createReview(review).pipe(
      switchMap(createdReview => {

        const comment = new Comment({
          id: 0,
          reviewId: Number(createdReview.id),
          content: input.comment,
          createdAt
        });

        return this.commentApi.createComment(comment).pipe(
          map(createdComment => ({
            id: Number(createdReview.id),
            userId: Number(createdReview.userId),
            tourId: Number(createdReview.tourId),
            rating: Number(createdReview.rating),
            createdAt: createdReview.createdAt,
            commentId: Number(createdComment.id),
            comment: createdComment.content
          } as ReviewItem))
        );
      }),
      tap(item => {
        this.reviewsSignal.update(reviews => [
          ...reviews,
          item
        ]);
      }),
      catchError((error: unknown) => {
        this.setError(error, 'Error al crear la reseña');
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  // UPDATE: Actualizamos una reseña y su comentario
  updateReview(input: ReviewInput): Observable<ReviewItem> {
    this.errorSignal.set(null);

    if (input.id == null) {
      return throwError(
        () => new Error('Review ID is required')
      );
    }

    this.loadingSignal.set(true);

    const existing = this.reviews().find(
      review => review.id === Number(input.id)
    );

    const createdAt =
      existing?.createdAt ??
      input.createdAt ??
      new Date().toISOString();

    const review = new Review({
      id: Number(input.id),
      userId: Number(input.userId),
      tourId: Number(input.tourId),
      rating: Number(input.rating),
      createdAt
    });

    return this.reviewApi.updateReview(review).pipe(
      switchMap(updatedReview => {

        const commentId =
          input.commentId ?? existing?.commentId;

        const comment = new Comment({
          id: commentId != null ? Number(commentId) : 0,
          reviewId: Number(updatedReview.id),
          content: input.comment,
          createdAt
        });

        const commentRequest = commentId != null
          ? this.commentApi.updateComment(comment)
          : this.commentApi.createComment(comment);

        return commentRequest.pipe(
          map(savedComment => ({
            id: Number(updatedReview.id),
            userId: Number(updatedReview.userId),
            tourId: Number(updatedReview.tourId),
            rating: Number(updatedReview.rating),
            createdAt: updatedReview.createdAt,
            commentId: Number(savedComment.id),
            comment: savedComment.content
          } as ReviewItem))
        );
      }),
      tap(updated => {
        this.reviewsSignal.update(reviews =>
          reviews.map(review =>
            review.id === updated.id
              ? updated
              : review
          )
        );
      }),
      catchError((error: unknown) => {
        this.setError(error, 'Error al actualizar la reseña');
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  // DELETE: Eliminamos comentarios y reseña
  deleteReview(id: number): void {
    this.errorSignal.set(null);
    this.loadingSignal.set(true);

    this.commentApi.getComments().pipe(
      switchMap(comments => {

        const relatedComments = comments.filter(
          comment =>
            Number(comment.reviewId) === Number(id)
        );

        if (relatedComments.length === 0) {
          return of([]);
        }

        return forkJoin(
          relatedComments.map(comment =>
            this.commentApi.deleteComment(Number(comment.id))
          )
        );
      }),
      switchMap(() => this.reviewApi.deleteReview(id)),
      finalize(() => this.loadingSignal.set(false))
    ).subscribe({
      next: () => {
        this.reviewsSignal.update(reviews =>
          reviews.filter(
            review => review.id !== Number(id)
          )
        );
      },
      error: (error: unknown) => {
        this.setError(error, 'Error al eliminar la reseña');
      }
    });
  }

  // Centralizamos el manejo de errores
  private setError(
    error: unknown,
    fallback: string
  ): void {
    this.errorSignal.set(
      error instanceof Error ? error.message : fallback
    );
  }
}
