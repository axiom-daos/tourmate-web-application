import { Component, OnInit, DestroyRef, computed, inject, signal } from '@angular/core';

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

/**
 * Componente encargado de mostrar las reseñas.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './review-list.html',
  styleUrls: ['./review-list.css'],
})
export class ReviewList implements OnInit {
  // Servicios del componente.
  readonly reviewStore = inject(ReviewStore);

  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly iamStore = inject(IamStore);
  private readonly tourStore = inject(TourManagementStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // Estados de la aplicación.
  readonly reviews = this.reviewStore.reviews;
  readonly loading = this.reviewStore.loading;
  readonly error = this.reviewStore.error;

  // Identificador de la reseña que se está eliminando.
  private readonly deletingIdSignal = signal<number | null>(null);
  readonly deletingId = this.deletingIdSignal.asReadonly();

  /**
   * Ordena las reseñas desde la más reciente.
   */
  readonly orderedReviews = computed(() => {
    return [...this.reviews()].sort((a, b) => {
      const dateA = Date.parse(a.createdAt);
      const dateB = Date.parse(b.createdAt);

      const timeA = Number.isFinite(dateA) ? dateA : 0;
      const timeB = Number.isFinite(dateB) ? dateB : 0;

      return timeB - timeA || b.id - a.id;
    });
  });

  /**
   * Obtiene una traducción según el idioma seleccionado.
   */
  private t(key: string): string {
    return this.translate.instant(key);
  }

  /**
   * Carga las reseñas al ingresar a la página.
   */
  ngOnInit(): void {
    this.reviewStore.loadData();
  }

  /**
   * Abre el formulario para registrar una reseña.
   */
  addReview(): void {
    void this.router.navigate(['/feedback-and-tour-reviews/reviews/new']);
  }

  /**
   * Abre el formulario de edición.
   */
  editReview(id: number): void {
    if (!Number.isSafeInteger(id) || id <= 0 || this.loading()) {
      return;
    }

    void this.router.navigate(['/feedback-and-tour-reviews/reviews/edit', id]);
  }

  /**
   * Confirma y ejecuta la eliminación de una reseña.
   */
  deleteReview(id: number): void {
    // Evitamos identificadores inválidos y operaciones repetidas.
    if (!Number.isSafeInteger(id) || id <= 0 || this.loading() || this.deletingId() !== null) {
      return;
    }

    // El mensaje de confirmación utiliza el idioma actual.
    const confirmed = window.confirm(this.t('reviews.delete_confirm'));

    if (!confirmed) {
      return;
    }

    this.deletingIdSignal.set(id);

    this.reviewStore
      .deleteReviewRequest(id)
      .pipe(
        finalize(() => {
          this.deletingIdSignal.set(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          // Mensaje traducido cuando se elimina correctamente.
          this.snackBar.open(this.t('reviews.deleted_success'), this.t('reviews.close'), {
            duration: 3500,
          });
        },

        error: () => {
          // Mensaje traducido cuando ocurre un error.
          this.snackBar.open(this.t('reviews.delete_error'), this.t('reviews.close'), {
            duration: 5000,
          });
        },
      });
  }

  /**
   * Obtiene el nombre de un usuario desde IAM.
   */
  reviewerName(userId: number): string {
    const user = this.iamStore.users().find((candidate) => Number(candidate.id) === Number(userId));

    if (!user) {
      return this.t('reviews.unknown_user');
    }

    return `${user.firstName} ${user.lastName}`.trim();
  }

  /**
   * Obtiene el nombre de un tour desde Tour Management.
   */
  tourName(tourId: number): string {
    const tour = this.tourStore
      .tours()
      .find((candidate) => Number(candidate.id) === Number(tourId));

    return tour?.details?.title ?? this.t('reviews.unknown_tour');
  }

  /**
   * Mantiene la asignación actual de imágenes.
   */
  tourImage(tourId: number): string {
    const id = Number(tourId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return '/assets/tours/plantilla_1.png';
    }

    const index = ((id - 1) % 6) + 1;

    return `/assets/tours/plantilla_${index}.png`;
  }

  /**
   * Genera las estrellas que se muestran en la tarjeta.
   */
  ratingStars(rating: number): boolean[] {
    const safeRating = Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : 0;

    return Array.from({ length: 5 }, (_, index) => index < safeRating);
  }
}
