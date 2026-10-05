import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { ReviewStore } from '../../../application/review.store';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    TranslatePipe
  ],
  templateUrl: './review-list.html',
  styleUrls: ['./review-list.css']
})
export class ReviewList implements OnInit {
  readonly reviewStore = inject(ReviewStore);
  private router = inject(Router);

  displayedColumns: string[] = ['id', 'tourId', 'userId', 'rating', 'comment', 'createdAt', 'actions'];

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
    if (confirm('¿Estás seguro de que deseas eliminar esta reseña?')) {
      this.reviewStore.deleteReview(id);
    }
  }
}
