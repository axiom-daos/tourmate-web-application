import { Component, DestroyRef, OnInit, inject } from '@angular/core';
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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ReviewInput, ReviewItem, ReviewStore } from '../../../application/review.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { TourManagementStore } from '../../../../tour-management/application/tour-management-store';

function minimumTrimmedLength(length: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();

    if (!value) {
      return { required: true };
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

function integerRating(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === '') {
      return null;
    }

    return Number.isInteger(Number(control.value)) ? null : { invalidRating: true };
  };
}

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './review-form.html',
  styleUrls: ['./review-form.css'],
})
export class ReviewForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reviewStore = inject(ReviewStore);
  private readonly iamStore = inject(IamStore);
  private readonly tourStore = inject(TourManagementStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  isEditMode = false;
  isSaving = false;
  isLoadingReview = false;
  reviewLoaded = false;
  reviewId: number | null = null;
  errorMessage: string | null = null;

  originalUserId: number | null = null;
  originalTourId: number | null = null;

  private commentId: number | null = null;
  private createdAt: string | null = null;

  readonly users = this.iamStore.users;
  readonly tours = this.tourStore.tours;

  // null: sin calificar. 0: calificación válida.
  reviewForm: FormGroup = this.fb.group({
    tourId: [null, [Validators.required, Validators.min(1)]],
    userId: [null, [Validators.required, Validators.min(1)]],
    rating: [null, [Validators.required, Validators.min(0), Validators.max(5), integerRating()]],
    comment: ['', [minimumTrimmedLength(5)]],
  });

  private t(key: string): string {
    return this.translate.instant(key);
  }

  // Utilizado en review-form.html.
  zeroRatingLabel(): string {
    return this.t('reviews.rating_zero');
  }

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

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

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
          this.errorMessage = this.translateError(error, 'reviews.review_load_error');
        },
      });
  }

  private fillForm(review: ReviewItem): void {
    this.originalUserId = review.userId;
    this.originalTourId = review.tourId;
    this.commentId = review.commentId;
    this.createdAt = review.createdAt;

    this.reviewForm.patchValue({
      tourId: review.tourId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
    });

    // En edición se conservan usuario y tour.
    this.reviewForm.get('tourId')?.disable({ emitEvent: false });
    this.reviewForm.get('userId')?.disable({ emitEvent: false });

    this.reviewForm.markAsPristine();
    this.reviewForm.markAsUntouched();
  }

  userDisplayName(userId: number): string {
    const user = this.users().find((item) => Number(item.id) === Number(userId));

    return user
      ? `${user.firstName} ${user.lastName}`.trim()
      : `${this.t('reviews.unknown_user')} (#${userId})`;
  }

  tourDisplayName(tourId: number): string {
    const tour = this.tours().find((item) => Number(item.id) === Number(tourId));

    return tour?.details?.title ?? `${this.t('reviews.unknown_tour')} (#${tourId})`;
  }

  private validateInput(
    tourId: number,
    userId: number,
    rating: number | null,
    comment: string,
  ): boolean {
    if (!Number.isSafeInteger(tourId) || tourId <= 0) {
      this.errorMessage = this.t('reviews.select_tour_required');
      return false;
    }

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      this.errorMessage = this.t('reviews.select_client_required');
      return false;
    }

    if (rating === null || !Number.isInteger(rating) || rating < 0 || rating > 5) {
      this.errorMessage = this.t('reviews.invalid_rating');
      return false;
    }

    if (comment.length < 5) {
      this.errorMessage = this.t('reviews.comment_min_length');
      return false;
    }

    return true;
  }

  onSubmit(): void {
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

    const tourId = this.isEditMode ? (this.originalTourId ?? 0) : Number(values.tourId);

    const userId = this.isEditMode ? (this.originalUserId ?? 0) : Number(values.userId);

    const rating = values.rating === null || values.rating === '' ? null : Number(values.rating);

    const comment = String(values.comment ?? '').trim();

    if (!this.validateInput(tourId, userId, rating, comment)) {
      return;
    }

    const input: ReviewInput = {
      tourId,
      userId,
      rating: rating as number,
      comment,
      createdAt: this.createdAt ?? new Date().toISOString(),
    };

    if (this.isEditMode && this.reviewId !== null) {
      input.id = this.reviewId;
      input.commentId = this.commentId;
    }

    this.isSaving = true;
    this.errorMessage = null;

    const request = this.isEditMode
      ? this.reviewStore.updateReview(input)
      : this.reviewStore.addReview(input);

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
