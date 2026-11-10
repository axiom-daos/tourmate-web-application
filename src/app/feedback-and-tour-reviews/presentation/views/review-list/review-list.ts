import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ReviewStore } from '../../../application/review.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { TourManagementStore } from '../../../../tour-management/application/tour-management-store';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './review-list.html',
  styleUrls: ['./review-list.css'],
})
export class ReviewList implements OnInit {
  readonly reviewStore = inject(ReviewStore);

  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly iamStore = inject(IamStore);
  private readonly tourStore = inject(TourManagementStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly reviews = this.reviewStore.reviews;
  readonly loading = this.reviewStore.loading;
  readonly error = this.reviewStore.error;

  private readonly deletingIdSignal = signal<number | null>(null);
  readonly deletingId = this.deletingIdSignal.asReadonly();

  readonly orderedReviews = computed(() =>
    [...this.reviews()].sort((a, b) => {
      const timeA = Date.parse(a.createdAt) || 0;
      const timeB = Date.parse(b.createdAt) || 0;

      return timeB - timeA || b.id - a.id;
    }),
  );

  private t(key: string): string {
    return this.translate.instant(key);
  }

  ngOnInit(): void {
    this.reviewStore.loadData();
  }

  addReview(): void {
    void this.router.navigate(['/feedback-and-tour-reviews/reviews/new']);
  }

  editReview(id: number): void {
    if (!Number.isSafeInteger(id) || id <= 0 || this.loading()) {
      return;
    }

    void this.router.navigate(['/feedback-and-tour-reviews/reviews/edit', id]);
  }

  deleteReview(id: number): void {
    if (!Number.isSafeInteger(id) || id <= 0 || this.loading() || this.deletingId() !== null) {
      return;
    }

    if (!window.confirm(this.t('reviews.delete_confirm'))) {
      return;
    }

    this.deletingIdSignal.set(id);

    this.reviewStore
      .deleteReviewRequest(id)
      .pipe(
        finalize(() => this.deletingIdSignal.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open(this.t('reviews.deleted_success'), this.t('reviews.close'), {
            duration: 3500,
          });
        },
        error: () => {
          this.snackBar.open(this.t('reviews.delete_error'), this.t('reviews.close'), {
            duration: 5000,
          });
        },
      });
  }

  reviewerName(userId: number): string {
    const user = this.iamStore.users().find((item) => Number(item.id) === Number(userId));

    return user ? `${user.firstName} ${user.lastName}`.trim() : this.t('reviews.unknown_user');
  }

  tourName(tourId: number): string {
    const tour = this.tourStore.tours().find((item) => Number(item.id) === Number(tourId));

    return tour?.details?.title ?? this.t('reviews.unknown_tour');
  }

  tourImage(tourId: number): string {
    if (!Number.isSafeInteger(tourId) || tourId <= 0) {
      return '/assets/tours/plantilla_1.png';
    }

    const index = ((tourId - 1) % 6) + 1;
    return `/assets/tours/plantilla_${index}.png`;
  }

  // Cero estrellas muestra las cinco estrellas vacías.
  ratingStars(rating: number): boolean[] {
    const stars = Number.isInteger(rating) ? Math.max(0, Math.min(5, rating)) : 0;

    return Array.from({ length: 5 }, (_, index) => index < stars);
  }

  ratingAccessibleLabel(rating: number): string {
    const label = this.translate.instant('reviews.rating_aria', { rating });

    return rating === 0 ? `${label} (${this.zeroRatingLabel()})` : label;
  }

  zeroRatingLabel(): string {
    return this.t('reviews.rating_zero');
  }
}
