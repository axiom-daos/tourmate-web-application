import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ReviewStore } from '../../../application/review.store';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './review-form.html',
  styleUrls: ['./review-form.css'],
})
export class ReviewForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(ReviewStore); // Asegúrate de que tu store se llame así

  form = this.fb.group({
    tourId: new FormControl<number | null>(null, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    userId: new FormControl<number | null>(null, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    rating: new FormControl<number>(5, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(5)],
    }),
    comment: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    createdAt: new FormControl<string>(new Date().toISOString(), {
      nonNullable: true,
    })
  });

  isEdit = false;
  reviewId: number | null = null;

  constructor() {
    this.route.params.subscribe((params) => {
      this.reviewId = params['id'] ? +params['id'] : null;
      this.isEdit = !!this.reviewId;
      // Aquí iría la lógica para cargar la reseña si estuvieras editando
    });
  }

  submit() {
    if (this.form.invalid) return;

    // Aquí llamas al método de tu store para guardar la reseña
    // this.store.addReview(this.form.value);

    // Redirige de vuelta a la lista de reseñas
    this.router.navigate(['feedback-and-tour-reviews/reviews']).then();
  }
}
