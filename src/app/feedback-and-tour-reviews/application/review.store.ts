import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReviewStore {
  private http = inject(HttpClient);

  // Señales de estado privadas
  private _reviewsSignal = signal<any[]>([]);
  private _loadingSignal = signal<boolean>(false);

  // Getters públicos para consumir las señales
  get reviews() {
    return this._reviewsSignal;
  }

  get loading() {
    return this._loadingSignal;
  }

  // Carga y fusiona /reviews con /comments del json-server
  loadData(): void {
    this._loadingSignal.set(true);

    forkJoin({
      reviews: this.http.get<any[]>('https://6ac570fc54a61668c5f72d4d.mockapi.io/api/v1/reviews'),
      comments: this.http.get<any[]>('https://6ac570fc54a61668c5f72d4d.mockapi.io/api/v1/comments')
    }).subscribe(({ reviews, comments }) => {
      const merged = reviews.map((rev: any) => {
        const found = comments.find((c: any) => c.reviewId === rev.id || c.id === rev.id);
        return {
          ...rev,
          comment: found ? found.content : (rev.comment || 'Sin comentario')
        };
      });
      this._reviewsSignal.set(merged);
      this._loadingSignal.set(false);
    });
  }

  getReviewById(id: number) {
    return () => this._reviewsSignal().find((r: any) => r.id === id);
  }

  addReview(newReview: any): void {
    this.http.post<any>('http://localhost:3000/reviews', {
      userId: newReview.userId,
      tourId: newReview.tourId,
      rating: newReview.rating,
      createdAt: newReview.createdAt
    }).subscribe((createdReview: any) => {
      const generatedId = createdReview.id;
      this.http.post('http://localhost:3000/comments', {
        reviewId: generatedId,
        content: newReview.comment,
        createdAt: newReview.createdAt
      }).subscribe({
        next: () => {
          const reviewWithId = { ...newReview, id: generatedId };
          this._reviewsSignal.set([...this._reviewsSignal(), reviewWithId]);
        },
        error: () => {
          const reviewWithId = { ...newReview, id: generatedId };
          this._reviewsSignal.set([...this._reviewsSignal(), reviewWithId]);
        }
      });
    });
  }

  updateReview(updated: any): void {
    this.http.put(`http://localhost:3000/reviews/${updated.id}`, {
      id: updated.id,
      userId: updated.userId,
      tourId: updated.tourId,
      rating: updated.rating,
      createdAt: updated.createdAt
    }).subscribe(() => {
      this.http.put(`http://localhost:3000/comments/${updated.id}`, {
        id: updated.id,
        reviewId: updated.id,
        content: updated.comment,
        createdAt: updated.createdAt
      }).subscribe({
        next: () => {
          const updatedList = this._reviewsSignal().map((r: any) => r.id === updated.id ? updated : r);
          this._reviewsSignal.set(updatedList);
        },
        error: () => {
          const updatedList = this._reviewsSignal().map((r: any) => r.id === updated.id ? updated : r);
          this._reviewsSignal.set(updatedList);
        }
      });
    });
  }

  deleteReview(id: number): void {
    // 1. Actualizamos la interfaz de forma inmediata (quita el elemento de la tabla al instante)
    const filtered = this._reviewsSignal().filter((r: any) => r.id !== id);
    this._reviewsSignal.set(filtered);

    // 2. Eliminamos en el servidor en segundo plano sin bloquear la vista si falla un recurso
    this.http.delete(`http://localhost:3000/reviews/${id}`).subscribe({
      error: (err) => console.error('Error al borrar review en servidor', err)
    });

    this.http.delete(`http://localhost:3000/comments/${id}`).subscribe({
      error: (err) => console.log('Comentario no encontrado en servidor', err)
    });
  }
}
