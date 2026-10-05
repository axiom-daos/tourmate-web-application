import { inject, Injectable } from '@angular/core';
import { Review } from '../domain/model/aggregates/review.entity';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReviewApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/reviews';

  getReviews(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getReview(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createReview(review: Review): Observable<any> {
    return this.http.post<any>(this.baseUrl, review);
  }

  updateReview(review: Review): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${review.id}`, review);
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
