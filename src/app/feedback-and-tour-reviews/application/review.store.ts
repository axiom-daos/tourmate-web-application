import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewStore {
  private http = inject(HttpClient);

  private readonly reviewsUrl = `${environment.reviewsApiBaseUrl || 'https://6ac570fc54a61668c5f72d4d.mockapi.io/api/v1'}/reviews`;
  private readonly commentsUrl = `${environment.commentsApiBaseUrl || 'https://6ac570fc54a61668c5f72d4d.mockapi.io/api/v1'}/comments`;

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

  // Carga y fusiona /reviews con /comments
  loadData(): void {
    this._loadingSignal.set(true);

    forkJoin({
      reviews: this.http.get<any[]>(this.reviewsUrl),
      comments: this.http.get<any[]>(this.commentsUrl)
    }).subscribe({
      next: ({ reviews, comments }) => {
        const merged = reviews.map((rev: any) => {
          const found = comments.find((c: any) =>
            Number(c.reviewId) === Number(rev.id) ||
            Number(c.id) === Number(rev.id) ||
            String(c.reviewId) === String(rev.id)
          );
          return {
            ...rev,
            commentId: found ? found.id : null,
            comment: found ? found.content : (rev.comment || 'Sin comentario')
          };
        });
        this._reviewsSignal.set(merged);
        this._loadingSignal.set(false);
      },
      error: (err) => {
        console.error('Error al cargar reviews/comments:', err);
        this._loadingSignal.set(false);
      }
    });
  }

  getReviewById(id: number) {
    return () => this._reviewsSignal().find((r: any) => Number(r.id) === Number(id));
  }

  addReview(newReview: any): void {
    this.http.post<any>(this.reviewsUrl, {
      userId: Number(newReview.userId),
      tourId: Number(newReview.tourId),
      rating: Number(newReview.rating),
      createdAt: newReview.createdAt || new Date().toISOString()
    }).subscribe({
      next: (createdReview: any) => {
        const generatedId = createdReview.id;
        this.http.post(this.commentsUrl, {
          reviewId: generatedId,
          content: newReview.comment,
          createdAt: newReview.createdAt || new Date().toISOString()
        }).subscribe({
          next: (createdComment: any) => {
            const reviewWithId = {
              ...newReview,
              id: generatedId,
              commentId: createdComment?.id
            };
            this._reviewsSignal.set([...this._reviewsSignal(), reviewWithId]);
          },
          error: () => {
            const reviewWithId = { ...newReview, id: generatedId };
            this._reviewsSignal.set([...this._reviewsSignal(), reviewWithId]);
          }
        });
      },
      error: () => {
        const fallbackId = Date.now();
        const reviewWithId = { ...newReview, id: fallbackId };
        this._reviewsSignal.set([...this._reviewsSignal(), reviewWithId]);
      }
    });
  }

  updateReview(updated: any): void {
    const updateSignal = () => {
      const updatedList = this._reviewsSignal().map((r: any) =>
        Number(r.id) === Number(updated.id) || String(r.id) === String(updated.id)
          ? { ...r, ...updated }
          : r
      );
      this._reviewsSignal.set(updatedList);
    };

    const reviewPayload = {
      id: updated.id,
      userId: Number(updated.userId),
      tourId: Number(updated.tourId),
      rating: Number(updated.rating),
      createdAt: updated.createdAt || new Date().toISOString()
    };

    this.http.put(`${this.reviewsUrl}/${updated.id}`, reviewPayload).subscribe({
      next: () => {
        const commentId = updated.commentId ?? updated.id;
        this.http.put(`${this.commentsUrl}/${commentId}`, {
          id: commentId,
          reviewId: updated.id,
          content: updated.comment,
          createdAt: updated.createdAt || new Date().toISOString()
        }).subscribe({
          next: () => updateSignal(),
          error: () => updateSignal()
        });
      },
      error: () => {
        updateSignal();
      }
    });
  }

  deleteReview(id: number): void {
    // 1. Actualizamos la interfaz de forma inmediata (optimista)
    const filtered = this._reviewsSignal().filter((r: any) => Number(r.id) !== Number(id));
    this._reviewsSignal.set(filtered);

    // 2. Eliminamos en el servidor en segundo plano
    this.http.delete(`${this.reviewsUrl}/${id}`).subscribe({
      error: (err) => console.error('Error al borrar review en servidor', err)
    });

    this.http.delete(`${this.commentsUrl}/${id}`).subscribe({
      error: (err) => console.log('Comentario no encontrado en servidor', err)
    });
  }
}
