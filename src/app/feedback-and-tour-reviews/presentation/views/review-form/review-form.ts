
import {
  Component,
  OnInit,
  inject,
  effect
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import {
  RouterModule,
  Router,
  ActivatedRoute
} from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';

import {
  ReviewStore,
  ReviewInput
} from '../../../application/review.store';

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
    TranslatePipe
  ],
  templateUrl: './review-form.html',
  styleUrls: ['./review-form.css']
})
export class ReviewForm implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly reviewStore = inject(ReviewStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isEditMode = false;
  isSaving = false;
  reviewLoaded = false;

  reviewId: number | null = null;
  errorMessage: string | null = null;

  private commentId: number | null = null;
  private createdAt: string | null = null;

  // Definimos el formulario y sus validaciones
  reviewForm: FormGroup = this.fb.group({
    tourId: [
      '',
      [Validators.required, Validators.min(1)]
    ],
    userId: [
      '',
      [Validators.required, Validators.min(1)]
    ],
    rating: [
      5,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(5)
      ]
    ],
    comment: [
      '',
      [Validators.required]
    ]
  });

  constructor() {

    // Cargamos los datos de la reseña al editar
    effect(() => {
      const reviews = this.reviewStore.reviews();

      if (
        !this.isEditMode ||
        this.reviewId === null ||
        this.reviewLoaded
      ) {
        return;
      }

      const existingReview = reviews.find(
        review => review.id === this.reviewId
      );

      if (existingReview) {
        this.commentId = existingReview.commentId;
        this.createdAt = existingReview.createdAt;
        this.reviewLoaded = true;

        this.reviewForm.patchValue({
          tourId: existingReview.tourId,
          userId: existingReview.userId,
          rating: existingReview.rating,
          comment: existingReview.comment
        });
      }
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam !== null) {
      const id = Number(idParam);

      if (!Number.isInteger(id) || id <= 0) {
        this.errorMessage = 'Identificador de reseña inválido.';
        return;
      }

      this.isEditMode = true;
      this.reviewId = id;

      // Consultamos los datos cuando no están cargados
      if (this.reviewStore.reviews().length === 0) {
        this.reviewStore.loadData();
      }
    }
  }

  // Validamos y enviamos el formulario
  onSubmit(): void {

    if (this.reviewForm.invalid || this.isSaving) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode && !this.reviewLoaded) {
      this.errorMessage =
        'La reseña todavía no está disponible.';
      return;
    }

    const values = this.reviewForm.value;

    const tourId = Number(values.tourId);
    const userId = Number(values.userId);
    const rating = Number(values.rating);
    const comment = String(values.comment ?? '').trim();

    // Validamos los datos ingresados
    if (
      !Number.isInteger(tourId) ||
      tourId <= 0 ||
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      comment.length === 0
    ) {
      this.errorMessage =
        'Verifica los datos del formulario.';
      return;
    }

    const review: ReviewInput = {
      tourId,
      userId,
      rating,
      comment,
      createdAt: this.createdAt ?? new Date().toISOString()
    };

    // Conservamos los identificadores al editar
    if (this.isEditMode && this.reviewId !== null) {
      review.id = this.reviewId;
      review.commentId = this.commentId;
    }

    this.isSaving = true;
    this.errorMessage = null;

    // Ejecutamos CREATE o UPDATE
    const request = this.isEditMode
      ? this.reviewStore.updateReview(review)
      : this.reviewStore.addReview(review);

    request.subscribe({
      next: () => {
        this.isSaving = false;

        // Navegamos cuando la API confirma el guardado
        this.router.navigate([
          '/feedback-and-tour-reviews/reviews'
        ]);
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage =
          'Ocurrió un error al guardar la reseña.';
      }
    });
  }
}
