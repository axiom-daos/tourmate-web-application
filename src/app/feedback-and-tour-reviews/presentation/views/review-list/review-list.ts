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
  styleUrls: ['./review-list.css']
})
export class ReviewList implements OnInit {
  readonly reviewStore = inject(ReviewStore);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private iamStore = inject(IamStore);
  private tourStore = inject(TourManagementStore);

  get reviews() {
    return this.reviewStore.reviews;
  }

  ngOnInit(): void {
    this.reviewStore.loadData();
  }

  editReview(id: number): void {
    this.router.navigate([`/feedback-and-tour-reviews/reviews/edit`, id]);
  }

  deleteReview(id: number): void {
    if (confirm(this.translate.instant('reviews.delete_confirm'))) {
      this.reviewStore.deleteReview(id);
    }
  }

  reviewerName(userId: number): string {
    const user = this.iamStore.users().find(candidate => candidate.id === userId);
    return user
      ? `${user.firstName} ${user.lastName}`.trim()
      : this.translate.instant('reviews.unknown_user');
  }

  tourName(tourId: number): string {
    const tour = this.tourStore.tours().find(candidate => candidate.id === tourId);
    return tour?.details.title ?? this.translate.instant('reviews.unknown_tour');
  }

  ratingStars(rating: number): boolean[] {
    const safeRating = Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : 0;
    return Array.from({ length: 5 }, (_, index) => index < safeRating);
  }
}
