import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReviewStore } from '../../../application/review.store';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './review-form.html',
  styleUrls: ['./review-form.css']
})
export class ReviewForm implements OnInit {
  private fb = inject(FormBuilder);
  readonly reviewStore = inject(ReviewStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  reviewForm!: FormGroup;
  isEditMode = false;
  reviewId: number | null = null;

  ngOnInit(): void {
    this.reviewForm = this.fb.group({
      tourId: ['', Validators.required],
      userId: ['', Validators.required],
      rating: [5, Validators.required],
      comment: ['', Validators.required]
    });

    this.reviewStore.loadData();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.reviewId = Number(idParam);

      const existingReview = this.reviewStore.getReviewById(this.reviewId)();
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
      const updatedReview = {
        id: this.reviewId,
        tourId: Number(formValues.tourId),
        userId: Number(formValues.userId),
        rating: Number(formValues.rating),
        comment: formValues.comment,
        createdAt: new Date().toISOString()
      };
      this.reviewStore.updateReview(updatedReview);
    } else {
      const newReview = {
        id: Date.now(),
        tourId: Number(formValues.tourId),
        userId: Number(formValues.userId),
        rating: Number(formValues.rating),
        comment: formValues.comment,
        createdAt: new Date().toISOString()
      };
      this.reviewStore.addReview(newReview);
    }

    this.router.navigate(['/feedback-and-tour-reviews/reviews']);
  }
}
