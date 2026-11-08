import { Component, OnInit, DestroyRef, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ReviewStore, ReviewInput, ReviewItem } from '../../../application/review.store';

import { IamStore } from '../../../../iam/application/iam.store';

import { TourManagementStore } from '../../../../tour-management/application/tour-management-store';

/**
 * Valida que el comentario tenga al menos
 * la cantidad indicada de caracteres.
 *
 * No considera los espacios de los extremos.
 */
function minimumTrimmedLength(length: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();

    // El campo vacío se valida mediante Validators.required.
    if (value.length === 0) {
      return null;
    }

    return value.length < length
      ? {
          minlength: {
            requiredLength: length,
            actualLength: value.length,
          },
        }
      : null;
  };
}

/**
 * Formulario para crear y editar reseñas.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './review-form.html',
  styleUrls: ['./review-form.css'],
})
export class ReviewForm implements OnInit {
  // Inyectamos los servicios necesarios.
  private readonly fb = inject(FormBuilder);
  private readonly reviewStore = inject(ReviewStore);
  private readonly iamStore = inject(IamStore);
  private readonly tourStore = inject(TourManagementStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  // Estados utilizados por el formulario.
  isEditMode = false;
  isSaving = false;
  isLoadingReview = false;
  reviewLoaded = false;

  reviewId: number | null = null;
  errorMessage: string | null = null;

  // Conservamos estos datos al editar una reseña.
  private commentId: number | null = null;
  private createdAt: string | null = null;

  // Obtenemos usuarios y tours de los BC correspondientes.
  readonly users = this.iamStore.users;
  readonly tours = this.tourStore.tours;

  /**
   * Formulario reactivo con sus respectivas validaciones.
   */
  reviewForm: FormGroup = this.fb.group({
    tourId: ['', [Validators.required, Validators.min(1)]],
    userId: ['', [Validators.required, Validators.min(1)]],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.required, minimumTrimmedLength(5)]],
  });

  /**
   * Obtiene un mensaje traducido.
   */
  private t(key: string): string {
    return this.translate.instant(key);
  }

  /**
   * Convierte los errores conocidos de ReviewStore
   * en mensajes del idioma seleccionado.
   */
  private translateError(error: unknown, fallbackKey: string): string {
    const message = error instanceof Error ? error.message : '';

    if (message.includes('ya ha dejado una reseña')) {
      return this.t('reviews.duplicate_review');
    }

    if (message.includes('calificación debe estar')) {
      return this.t('reviews.invalid_rating');
    }

    if (message.includes('comentario debe tener')) {
      return this.t('reviews.comment_min_length');
    }

    return this.t(fallbackKey);
  }

  /**
   * Comprueba si se va a crear o editar una reseña.
   */
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    // Sin identificador, abrimos el formulario de creación.
    if (idParam === null) {
      return;
    }

    this.isEditMode = true;

    const id = Number(idParam);

    if (!Number.isSafeInteger(id) || id <= 0) {
      this.errorMessage = this.t('reviews.invalid_review_id');
      return;
    }

    this.reviewId = id;
    this.loadReview(id);
  }

  /**
   * Consulta la reseña directamente por ID.
   */
  private loadReview(id: number): void {
    this.isLoadingReview = true;
    this.reviewLoaded = false;
    this.errorMessage = null;

    this.reviewStore
      .loadReviewById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (review: ReviewItem) => {
          this.fillForm(review);
          this.reviewLoaded = true;
          this.isLoadingReview = false;
        },

        error: (error: unknown) => {
          this.isLoadingReview = false;
          this.reviewLoaded = false;

          this.errorMessage = this.translateError(error, 'reviews.review_load_error');
        },
      });
  }

  /**
   * Completa el formulario con los datos existentes.
   */
  private fillForm(review: ReviewItem): void {
    this.commentId = review.commentId;
    this.createdAt = review.createdAt;

    this.reviewForm.patchValue({
      tourId: review.tourId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
    });

    this.reviewForm.markAsPristine();
    this.reviewForm.markAsUntouched();
  }

  /**
   * Obtiene el nombre de un usuario desde IAM.
   */
  userDisplayName(userId: number): string {
    const user = this.iamStore.users().find((candidate) => Number(candidate.id) === Number(userId));

    return user ? `${user.firstName} ${user.lastName}`.trim() : this.t('reviews.unknown_user');
  }

  /**
   * Obtiene el nombre de un tour desde Tour Management.
   */
  tourDisplayName(tourId: number): string {
    const tour = this.tourStore
      .tours()
      .find((candidate) => Number(candidate.id) === Number(tourId));

    return tour?.details?.title ?? this.t('reviews.unknown_tour');
  }

  /**
   * Comprueba los valores antes de enviarlos al Store.
   */
  private validateInput(tourId: number, userId: number, rating: number, comment: string): boolean {
    if (!Number.isSafeInteger(tourId) || tourId <= 0) {
      this.errorMessage = this.t('reviews.select_tour_required');
      return false;
    }

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      this.errorMessage = this.t('reviews.select_client_required');
      return false;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      this.errorMessage = this.t('reviews.invalid_rating');
      return false;
    }

    if (comment.length < 5) {
      this.errorMessage = this.t('reviews.comment_min_length');
      return false;
    }

    return true;
  }

  /**
   * Procesa la creación o actualización de una reseña.
   */
  onSubmit(): void {
    // Evitamos solicitudes repetidas.
    if (this.isSaving || this.isLoadingReview) {
      return;
    }

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode && !this.reviewLoaded) {
      this.errorMessage = this.t('reviews.review_not_ready');
      return;
    }

    const values = this.reviewForm.getRawValue();

    const tourId = Number(values.tourId);
    const userId = Number(values.userId);
    const rating = Number(values.rating);
    const comment = String(values.comment ?? '').trim();

    if (!this.validateInput(tourId, userId, rating, comment)) {
      return;
    }

    const review: ReviewInput = {
      tourId,
      userId,
      rating,
      comment,
      createdAt: this.createdAt ?? new Date().toISOString(),
    };

    // Durante la edición mantenemos los identificadores.
    if (this.isEditMode && this.reviewId !== null) {
      review.id = this.reviewId;
      review.commentId = this.commentId;
    }

    this.isSaving = true;
    this.errorMessage = null;

    const request = this.isEditMode
      ? this.reviewStore.updateReview(review)
      : this.reviewStore.addReview(review);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving = false;

        void this.router.navigate(['/feedback-and-tour-reviews/reviews']);
      },

      error: (error: unknown) => {
        this.isSaving = false;

        this.errorMessage = this.translateError(error, 'reviews.save_error');
      },
    });
  }
}
