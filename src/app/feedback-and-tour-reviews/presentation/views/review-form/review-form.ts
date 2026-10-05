import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { ReviewStore } from '../../../application/review.store';

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
  private fb = inject(FormBuilder);
  private reviewStore = inject(ReviewStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  reviewForm: FormGroup = this.fb.group({
    tourId: ['', [Validators.required]],
    userId: ['', [Validators.required]],
    rating: [5, [Validators.required]],
    comment: ['', [Validators.required]]
  });

  isEditMode = false;
  reviewId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.reviewId = Number(idParam);
      const existingReview = this.reviewStore.reviews().find(r => r.id === this.reviewId);
      if (existingReview) {
        this.reviewForm.patchValue({
          tourId: existingReview.tourId,
          userId: existingReview.userId,
          rating: existingReview.rating,
          comment: existingReview.comment
        });
      }
    }
  }

  onSubmit(): void {
    if (this.reviewForm.invalid) return;

    const formValues = this.reviewForm.value;

    if (this.isEditMode && this.reviewId !== null) {
      this.reviewStore.updateReview({
        id: this.reviewId,
        tourId: Number(formValues.tourId),
        userId: Number(formValues.userId),
        rating: Number(formValues.rating),
        comment: formValues.comment,
        createdAt: new Date().toISOString()
      });
    } else {
      this.reviewStore.addReview({
        tourId: Number(formValues.tourId),
        userId: Number(formValues.userId),
        rating: Number(formValues.rating),
        comment: formValues.comment,
        createdAt: new Date().toISOString()
      });
    }

    this.router.navigate(['/feedback-and-tour-reviews/reviews']);
  }
}
