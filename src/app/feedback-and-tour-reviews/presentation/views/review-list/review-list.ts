import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ReviewStore } from '../../../application/review.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { TourManagementStore } from '../../../../tour-management/application/tour-management-store';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './review-list.html',
  styleUrls: ['./review-list.css'],
})
export class ReviewList implements OnInit {
  readonly reviewStore = inject(ReviewStore);

  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly iamStore = inject(IamStore);
  private readonly tourStore = inject(TourManagementStore);

  readonly reviews = this.reviewStore.reviews;
  readonly loading = this.reviewStore.loading;
  readonly error = this.reviewStore.error;

  ngOnInit(): void {
    this.reviewStore.loadData();
  }

  addReview(): void {
    this.router.navigate(['/feedback-and-tour-reviews/reviews/new']);
  }

  editReview(id: number): void {
    this.router.navigate(['/feedback-and-tour-reviews/reviews/edit', id]);
  }

  deleteReview(id: number): void {
    if (this.loading()) {
      return;
    }

    const message = this.translate.instant('reviews.delete_confirm');

    if (confirm(message)) {
      this.reviewStore.deleteReview(id);
    }
  }

  reviewerName(userId: number): string {
    const user = this.iamStore.users().find((candidate) => Number(candidate.id) === Number(userId));

    return user
      ? `${user.firstName} ${user.lastName}`.trim()
      : this.translate.instant('reviews.unknown_user');
  }

  tourName(tourId: number): string {
    const tour = this.tourStore
      .tours()
      .find((candidate) => Number(candidate.id) === Number(tourId));

    return tour?.details.title ?? this.translate.instant('reviews.unknown_tour');
  }

  tourImage(tourId: number): string {
    const index = Number(tourId) > 0 ? ((Number(tourId) - 1) % 6) + 1 : 1;
    return `/assets/tours/plantilla_${index}.png`;
  }

  ratingStars(rating: number): boolean[] {
    const safeRating = Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : 0;

    return Array.from({ length: 5 }, (_, index) => index < safeRating);
  }
}
