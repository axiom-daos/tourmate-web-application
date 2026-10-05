import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { ReviewStore } from '../../../application/review.store'; // Ruta corregida hacia application

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTableModule, MatButtonModule],
  templateUrl: './review-list.html',
  styleUrls: ['./review-list.css']
})
export class ReviewList {
  readonly reviewStore = inject(ReviewStore);
  private router = inject(Router);

  displayedColumns: string[] = ['id', 'tourId', 'userId', 'rating', 'createdAt', 'actions'];

  get reviews() {
    return this.reviewStore.reviews();
  }

  editReview(id: number): void {
    this.router.navigate([`/feedback-and-tour-reviews/reviews/edit`, id]);
  }

  deleteReview(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta reseña?')) {
      this.reviewStore.deleteReview(id);
    }
  }
}
