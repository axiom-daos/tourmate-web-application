import { Injectable, computed, inject, signal } from '@angular/core';

import {
  Observable,
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { Review } from '../domain/model/aggregates/review.entity';
import { Comment } from '../domain/model/aggregates/comment.entity';
import { ReviewApi } from '../infrastructure/review-api';
import { CommentApi } from '../infrastructure/comment-api';

/**
 * View model that combines a review and its comment.
 */
export interface ReviewItem {
  id: number;
  userId: number;
  tourId: number;
  rating: number;
  createdAt: string;
  commentId: number | null;
  comment: string;
}

/**
 * Data required to create or update a review.
 */
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
 * Application store for Feedback and Tour Reviews.
 *
 * Coordinates API operations, validation,
 * and application state.
 */
@Injectable({
  providedIn: 'root',
})
export class ReviewStore {
  private readonly reviewApi = inject(ReviewApi);
  private readonly commentApi = inject(CommentApi);

  // Private state
  private readonly reviewsSignal = signal<ReviewItem[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public read-only state
  readonly reviews = this.reviewsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly reviewCount = computed(() => this.reviews().length);

  /**
   * Updates the error state.
   */
  private setError(error: unknown, fallback: string): void {
    const message = error instanceof Error ? error.message : fallback;

    this.errorSignal.set(message);
  }

  /**
   * Combines a review with its associated comment.
   */
  private mapReview(review: Review, comments: Comment[]): ReviewItem {
    const comment = comments.find((item) => item.reviewId === review.id);

    return {
      id: review.id,
      userId: review.userId,
      tourId: review.tourId,
      rating: review.rating,
      createdAt: review.createdAt,
      commentId: comment?.id ?? null,
      comment: comment?.content ?? '',
    };
  }

  /**
   * Inserts or replaces a review in the local state.
   */
  private upsert(item: ReviewItem): void {
    this.reviewsSignal.update((reviews) => {
      const exists = reviews.some((review) => review.id === item.id);

      if (exists) {
        return reviews.map((review) => (review.id === item.id ? item : review));
      }

      return [...reviews, item];
    });
  }

  // ==========================================
  // READ OPERATIONS
  // ==========================================

  /**
   * Loads all reviews and comments from the API.
   */
  loadData(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    forkJoin({
      reviews: this.reviewApi.getReviews(),
      comments: this.commentApi.getComments(),
    })
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: ({ reviews, comments }) => {
          const result = reviews.map((review) => this.mapReview(review, comments));

          this.reviewsSignal.set(result);
        },

        error: (error: unknown) => {
          this.setError(error, 'Error al cargar las reseñas.');
        },
      });
  }

  /**
   * Finds a review in the current local state.
   */
  getReviewById(id: number) {
    return computed(() => this.reviews().find((review) => review.id === id));
  }

  /**
   * Gets a review directly from the API.
   */
  getReview(id: number): Observable<Review> {
    return this.reviewApi.getReview(id);
  }

  /**
   * Fetches a review and its comment by ID.
   *
   * This is useful when the review is not
   * available in the local state.
   */
  loadReviewById(id: number): Observable<ReviewItem> {
    if (!Number.isSafeInteger(id) || id <= 0) {
      return throwError(() => new Error('Identificador de reseña inválido.'));
    }

    this.errorSignal.set(null);

    return forkJoin({
      review: this.reviewApi.getReview(id),
      comments: this.commentApi.getComments(),
    }).pipe(
      map(({ review, comments }) => this.mapReview(review, comments)),

      tap((item) => this.upsert(item)),

      catchError((error: unknown) => {
        this.setError(error, 'No se pudo cargar la reseña.');

        return throwError(() => error);
      }),
    );
  }

  // ==========================================
  // VALIDATION
  // ==========================================

  /**
   * Checks whether a user has already reviewed
   * the selected tour in the loaded data.
   */
  private hasUserReviewedTour(userId: number, tourId: number, excludeId?: number): boolean {
    return this.reviews().some(
      (review) => review.userId === userId && review.tourId === tourId && review.id !== excludeId,
    );
  }

  /**
   * Validates the information entered by the user.
   */
  private validateInput(input: ReviewInput): void {
    Review.validateIds(input.userId, input.tourId);

    Review.validateRating(input.rating);

    Review.validateComment(input.comment);

    if (this.hasUserReviewedTour(input.userId, input.tourId, input.id)) {
      throw new Error('Este usuario ya ha dejado una reseña para este tour.');
    }
  }

  // ==========================================
  // CREATE OPERATION
  // ==========================================

  /**
   * Creates a review and its associated comment.
   */
  addReview(input: ReviewInput): Observable<ReviewItem> {
    this.errorSignal.set(null);

    try {
      this.validateInput(input);
    } catch (error) {
      this.setError(error, 'No se pudo validar la reseña.');

      return throwError(() => error);
    }

    const createdAt = input.createdAt ?? new Date().toISOString();

    const review = new Review({
      id: 0,
      userId: input.userId,
      tourId: input.tourId,
      rating: input.rating,
      createdAt,
    });

    this.loadingSignal.set(true);

    return this.reviewApi.createReview(review).pipe(
      switchMap((createdReview) => {
        const comment = new Comment({
          id: 0,
          reviewId: createdReview.id,
          content: input.comment,
          createdAt,
        });

        return this.commentApi.createComment(comment).pipe(
          map((createdComment) => this.mapReview(createdReview, [createdComment])),

          // Best-effort rollback if comment creation fails.
          catchError((error) =>
            this.reviewApi.deleteReview(createdReview.id).pipe(
              catchError(() => of(void 0)),
              switchMap(() => throwError(() => error)),
            ),
          ),
        );
      }),

      tap((item) => this.upsert(item)),

      catchError((error: unknown) => {
        this.setError(error, 'No se pudo crear la reseña.');

        return throwError(() => error);
      }),

      finalize(() => this.loadingSignal.set(false)),
    );
  }

  // ==========================================
  // UPDATE OPERATION
  // ==========================================

  /**
   * Updates a review and its comment.
   */
  updateReview(input: ReviewInput): Observable<ReviewItem> {
    this.errorSignal.set(null);

    if (input.id === undefined || !Number.isSafeInteger(input.id) || input.id <= 0) {
      const error = new Error('Identificador de reseña inválido.');

      this.setError(error, error.message);

      return throwError(() => error);
    }

    try {
      this.validateInput(input);
    } catch (error) {
      this.setError(error, 'No se pudo validar la reseña.');

      return throwError(() => error);
    }

    const previous = this.reviews().find((review) => review.id === input.id);

    const createdAt = previous?.createdAt ?? input.createdAt ?? new Date().toISOString();

    const review = new Review({
      id: input.id,
      userId: input.userId,
      tourId: input.tourId,
      rating: input.rating,
      createdAt,
    });

    this.loadingSignal.set(true);

    return this.reviewApi.updateReview(review).pipe(
      switchMap((updatedReview) => {
        const commentId = input.commentId ?? previous?.commentId ?? null;

        const comment = new Comment({
          id: commentId ?? 0,
          reviewId: updatedReview.id,
          content: input.comment,
          createdAt,
        });

        const request =
          commentId === null
            ? this.commentApi.createComment(comment)
            : this.commentApi.updateComment(comment);

        return request.pipe(map((savedComment) => this.mapReview(updatedReview, [savedComment])));
      }),

      tap((item) => this.upsert(item)),

      catchError((error: unknown) => {
        this.setError(error, 'No se pudo actualizar la reseña.');

        return throwError(() => error);
      }),

      finalize(() => this.loadingSignal.set(false)),
    );
  }

  // ==========================================
  // DELETE OPERATION
  // ==========================================

  /**
   * Deletes related comments and then the review.
   *
   * Returns an Observable so the UI can
   * handle success and error responses.
   */
  deleteReviewRequest(id: number): Observable<void> {
    if (!Number.isSafeInteger(id) || id <= 0) {
      return throwError(() => new Error('Identificador de reseña inválido.'));
    }

    this.errorSignal.set(null);
    this.loadingSignal.set(true);

    return this.commentApi.getComments().pipe(
      switchMap((comments) => {
        const relatedComments = comments.filter((comment) => comment.reviewId === id);

        if (relatedComments.length === 0) {
          return of([]);
        }

        return forkJoin(
          relatedComments.map((comment) => this.commentApi.deleteComment(comment.id)),
        );
      }),

      switchMap(() => this.reviewApi.deleteReview(id)),

      tap(() => {
        this.reviewsSignal.update((reviews) => reviews.filter((review) => review.id !== id));
      }),

      catchError((error: unknown) => {
        this.setError(error, 'No se pudo eliminar la reseña.');

        return throwError(() => error);
      }),

      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Keeps compatibility with the existing
   * ReviewList component.
   */
  deleteReview(id: number): void {
    this.deleteReviewRequest(id).subscribe({
      error: () => {
        // The error is already stored in errorSignal.
      },
    });
  }
}
