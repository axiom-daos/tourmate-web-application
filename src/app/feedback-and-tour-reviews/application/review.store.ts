import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { Review } from '../domain/model/aggregates/review.entity';
import { ReviewApi } from '../infrastructure/review-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReviewStore {
  private readonly reviewApi = inject(ReviewApi);

  readonly reviewCount = computed(() => this.reviews().length);
  private readonly reviewsSignal = signal<Review[]>([]);
  readonly reviews = this.reviewsSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    this.loadReviews();
  }

  getReviewById = (id: number): Signal<Review | undefined> =>
    computed(() => (id ? this.reviews().find((r) => r.id === id) : undefined));

  addReview = (review: Review): void => {
    this.loadingSignal.set(true);
    this.reviewApi.createReview(review).pipe(retry(2)).subscribe({
      next: (createdReview) => {
        this.reviewsSignal.update((reviews) => [...reviews, createdReview]);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
      },
    });
  };

  updateReview = (updatedReview: Review): void => {
    this.loadingSignal.set(true);
    this.reviewApi.updateReview(updatedReview).pipe(retry(2)).subscribe({
      next: (review) => {
        this.reviewsSignal.update((reviews) => reviews.map((r) => (r.id === review.id ? review : r)));
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
      },
    });
  };

  deleteReview = (id: number): void => {
    this.loadingSignal.set(true);
    this.reviewApi.deleteReview(id).pipe(retry(2)).subscribe({
      next: () => {
        this.reviewsSignal.update((reviews) => reviews.filter((r) => r.id !== id));
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
      },
    });
  };

  private loadReviews = (): void => {
    this.loadingSignal.set(true);
    this.reviewApi.getReviews().pipe(takeUntilDestroyed()).subscribe({
      next: (reviews) => {
        this.reviewsSignal.set(reviews);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
      },
    });
  };
}
