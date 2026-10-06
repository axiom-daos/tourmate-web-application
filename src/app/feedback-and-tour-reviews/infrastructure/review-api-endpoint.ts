import { inject, Injectable } from '@angular/core';
import { Review } from '../domain/model/aggregates/review.entity';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReviewApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://6ac570fc54a61668c5f72d4d.mockapi.io/api/v1/reviews';

  getReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(this.baseUrl);
  }

  getReview(id: number): Observable<Review> {
    return this.http.get<Review>(`${this.baseUrl}/${id}`);
  }

  createReview(review: Review): Observable<Review> {
    return this.http.post<Review>(this.baseUrl, review);
  }

  updateReview(review: Review): Observable<Review> {
    return this.http.put<Review>(`${this.baseUrl}/${review.id}`, review);
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
