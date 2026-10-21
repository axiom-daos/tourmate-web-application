
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

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
    TranslatePipe
  ],
  templateUrl: './review-list.html',
  styleUrls: ['./review-list.css']
})
export class ReviewList implements OnInit {

  readonly reviewStore = inject(ReviewStore);

  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly iamStore = inject(IamStore);
  private readonly tourStore = inject(TourManagementStore);

  // Obtenemos el estado desde ReviewStore
  readonly reviews = this.reviewStore.reviews;
  readonly loading = this.reviewStore.loading;
  readonly error = this.reviewStore.error;

  // Cargamos las reseñas al iniciar la vista
  ngOnInit(): void {
    this.reviewStore.loadData();
  }

  // Navegamos al formulario de creación
  addReview(): void {
    this.router.navigate([
      '/feedback-and-tour-reviews/reviews/new'
    ]);
  }

  // Navegamos al formulario de edición
  editReview(id: number): void {
    this.router.navigate([
      '/feedback-and-tour-reviews/reviews/edit',
      id
    ]);
  }

  // Confirmamos y eliminamos una reseña
  deleteReview(id: number): void {
    if (this.loading()) {
      return;
    }

    const message = this.translate.instant(
      'reviews.delete_confirm'
    );

    if (confirm(message)) {
      this.reviewStore.deleteReview(id);
    }
  }

  // Obtenemos el nombre del usuario desde IAM
  reviewerName(userId: number): string {
    const user = this.iamStore.users().find(
      candidate => Number(candidate.id) === Number(userId)
    );

    return user
      ? `${user.firstName} ${user.lastName}`.trim()
      : this.translate.instant('reviews.unknown_user');
  }

  // Obtenemos el nombre del tour
  tourName(tourId: number): string {
    const tour = this.tourStore.tours().find(
      candidate => Number(candidate.id) === Number(tourId)
    );

    return tour?.details.title ??
      this.translate.instant('reviews.unknown_tour');
  }

  // Generamos las estrellas de calificación
  ratingStars(rating: number): boolean[] {
    const safeRating = Number.isFinite(rating)
      ? Math.min(5, Math.max(0, Math.round(rating)))
      : 0;

    return Array.from(
      { length: 5 },
      (_, index) => index < safeRating
    );
  }
}
