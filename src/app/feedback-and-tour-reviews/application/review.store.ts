import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  defer,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { Review } from '../domain/model/aggregates/review.entity';
import { Comment } from '../domain/model/aggregates/comment.entity';
import { ReviewApi } from '../infrastructure/review-api';
import { CommentApi } from '../infrastructure/comment-api';

/**
 * Datos que combinan una reseña y su comentario
 * para mostrarlos en la interfaz.
 */
export interface ReviewItem {
  id: number;
  userId: number;
  tourId: number;
  rating: number;
  createdAt: string;
  commentId: number | null;
  comment: string;
}

/**
 * Datos necesarios para crear o editar una reseña.
 */
export interface ReviewInput {
  id?: number;
  userId: number;
  tourId: number;
  rating: number;
  comment: string;
  commentId?: number | null;
  createdAt?: string;
}

/**
 * Store de aplicación para reseñas turísticas.
 *
 * Coordina las operaciones con dos MockAPI:
 * una de reseñas y otra de comentarios.
 *
 * Reglas:
 * - Calificaciones de 0 a 5 estrellas.
 * - Un usuario puede reseñar un tour una sola vez.
 * - En edición solo cambian rating y comentario.
 * - Los comentarios pertenecen a una reseña
 *   mediante su identificador reviewId.
 */
@Injectable({
  providedIn: 'root',
})
export class ReviewStore {
  // Servicios de infraestructura.
  private readonly reviewApi = inject(ReviewApi);
  private readonly commentApi = inject(CommentApi);

  // Estado privado del Store.
  private readonly reviewsSignal = signal<ReviewItem[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // Evita creaciones simultáneas duplicadas
  // dentro de esta instancia del frontend.
  private readonly pendingCreations = new Set<string>();

  // Estado público de solo lectura.
  readonly reviews = this.reviewsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly reviewCount = computed(() => this.reviews().length);

  /**
   * Actualiza el mensaje de error del Store.
   */
  private setError(error: unknown, fallback: string): void {
    this.errorSignal.set(error instanceof Error ? error.message : fallback);
  }

  /**
   * Une una reseña con su comentario.
   *
   * La relación se realiza mediante reviewId.
   */
  private mapReview(review: Review, comments: Comment[]): ReviewItem {
    const comment = comments.find((item) => item.reviewId === review.id);

    return {
      id: review.id,
      userId: review.userId,
      tourId: review.tourId,
      rating: review.rating,
      createdAt: review.createdAt,
      commentId: comment?.id ?? null,
      comment: comment?.content ?? '',
    };
  }

  /**
   * Agrega o actualiza una reseña
   * dentro del estado local.
   */
  private upsert(item: ReviewItem): void {
    this.reviewsSignal.update((reviews) => {
      const exists = reviews.some((review) => review.id === item.id);

      return exists
        ? reviews.map((review) => (review.id === item.id ? item : review))
        : [...reviews, item];
    });
  }

  /**
   * Carga las reseñas y comentarios
   * desde sus respectivas MockAPI.
   */
  loadData(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    forkJoin({
      reviews: this.reviewApi.getReviews(),
      comments: this.commentApi.getComments(),
    })
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: ({ reviews, comments }) => {
          this.reviewsSignal.set(reviews.map((review) => this.mapReview(review, comments)));
        },

        error: (error: unknown) => {
          this.setError(error, 'Error al cargar las reseñas.');
        },
      });
  }

  /**
   * Busca una reseña dentro del estado local.
   */
  getReviewById(id: number) {
    return computed(() => this.reviews().find((review) => review.id === id));
  }

  /**
   * Consulta directamente una reseña por ID.
   */
  getReview(id: number): Observable<Review> {
    return this.reviewApi.getReview(id);
  }

  /**
   * Obtiene una reseña y su comentario por ID,
   * incluso cuando no están cargados en pantalla.
   */
  loadReviewById(id: number): Observable<ReviewItem> {
    if (!Number.isSafeInteger(id) || id <= 0) {
      return throwError(() => new Error('Identificador de reseña inválido.'));
    }

    this.errorSignal.set(null);

    return forkJoin({
      review: this.reviewApi.getReview(id),
      comments: this.commentApi.getComments(),
    }).pipe(
      map(({ review, comments }) => this.mapReview(review, comments)),

      tap((item) => this.upsert(item)),

      catchError((error: unknown) => {
        this.setError(error, 'No se pudo cargar la reseña.');

        return throwError(() => error);
      }),
    );
  }

  /**
   * Valida los datos de creación y edición.
   *
   * La calificación puede ser de 0 a 5.
   */
  private validateInput(input: ReviewInput): void {
    Review.validateIds(input.userId, input.tourId);

    Review.validateRating(input.rating);

    Review.validateComment(input.comment);
  }

  /**
   * Comprueba si el usuario ya registró
   * una reseña para ese tour en el estado local.
   */
  private hasUserReviewedTour(userId: number, tourId: number): boolean {
    return this.reviews().some((review) => review.userId === userId && review.tourId === tourId);
  }

  /**
   * Crea una reseña junto con su comentario.
   *
   * Antes de crear, consulta MockAPI para
   * comprobar si ya existe otra reseña del
   * mismo usuario para el mismo tour.
   */
  addReview(input: ReviewInput): Observable<ReviewItem> {
    return defer(() => {
      this.errorSignal.set(null);

      // Primero validamos la información.
      try {
        this.validateInput(input);
      } catch (error) {
        this.setError(error, 'No se pudo validar la reseña.');

        return throwError(() => error);
      }

      // Identificamos la combinación usuario-tour.
      const key = `${input.userId}:${input.tourId}`;

      // No permitimos duplicados locales
      // ni solicitudes idénticas simultáneas.
      if (this.pendingCreations.has(key) || this.hasUserReviewedTour(input.userId, input.tourId)) {
        const error = new Error('Este usuario ya ha dejado una reseña para este tour.');

        this.setError(error, error.message);

        return throwError(() => error);
      }

      this.pendingCreations.add(key);
      this.loadingSignal.set(true);

      const createdAt = new Date().toISOString();

      // Comprobamos también las reseñas
      // que realmente existen en MockAPI.
      return this.reviewApi.getReviews().pipe(
        switchMap((existingReviews) => {
          const duplicated = existingReviews.some(
            (review) => review.userId === input.userId && review.tourId === input.tourId,
          );

          if (duplicated || this.hasUserReviewedTour(input.userId, input.tourId)) {
            return throwError(
              () => new Error('Este usuario ya ha dejado una reseña para este tour.'),
            );
          }

          // Creamos la entidad de dominio.
          const newReview = new Review({
            id: 0,
            userId: input.userId,
            tourId: input.tourId,
            rating: input.rating,
            createdAt,
          });

          // Registramos la reseña.
          return this.reviewApi.createReview(newReview);
        }),

        switchMap((createdReview) => {
          // Creamos el comentario asociado.
          const newComment = new Comment({
            id: 0,
            reviewId: createdReview.id,
            content: input.comment,
            createdAt,
          });

          return this.commentApi.createComment(newComment).pipe(
            map((createdComment) => this.mapReview(createdReview, [createdComment])),

            // Si falla el registro del comentario,
            // intentamos eliminar la reseña creada.
            catchError((error: unknown) =>
              this.reviewApi.deleteReview(createdReview.id).pipe(
                catchError(() => of(void 0)),

                switchMap(() => throwError(() => error)),
              ),
            ),
          );
        }),

        // Guardamos el resultado en el estado local.
        tap((item) => this.upsert(item)),

        catchError((error: unknown) => {
          this.setError(error, 'No se pudo crear la reseña.');

          return throwError(() => error);
        }),

        finalize(() => {
          this.pendingCreations.delete(key);
          this.loadingSignal.set(false);
        }),
      );
    });
  }

  /**
   * Actualiza una reseña existente.
   *
   * Solo permite modificar:
   * - La calificación.
   * - El contenido del comentario.
   *
   * El usuario y el tour se comprueban
   * utilizando la reseña original de MockAPI.
   */
  updateReview(input: ReviewInput): Observable<ReviewItem> {
    return defer(() => {
      this.errorSignal.set(null);

      // Comprobamos el identificador.
      if (input.id === undefined || !Number.isSafeInteger(input.id) || input.id <= 0) {
        const error = new Error('Identificador de reseña inválido.');

        this.setError(error, error.message);

        return throwError(() => error);
      }

      // Validamos la calificación y comentario.
      try {
        this.validateInput(input);
      } catch (error) {
        this.setError(error, 'No se pudo validar la reseña.');

        return throwError(() => error);
      }

      const reviewId = input.id;

      this.loadingSignal.set(true);

      // Consultamos los registros originales.
      return forkJoin({
        original: this.reviewApi.getReview(reviewId),
        comments: this.commentApi.getComments(),
      }).pipe(
        switchMap(({ original, comments }) => {
          // No permitimos cambiar de usuario ni tour.
          if (original.userId !== input.userId || original.tourId !== input.tourId) {
            return throwError(
              () => new Error('No se puede cambiar el usuario ni el tour de una reseña existente.'),
            );
          }

          // Localizamos el comentario original.
          const existingComment = comments.find((comment) => comment.reviewId === reviewId);

          // Creamos una reseña conservando
          // sus datos originales.
          const updatedReview = new Review({
            id: original.id,
            userId: original.userId,
            tourId: original.tourId,
            rating: input.rating,
            createdAt: original.createdAt,
          });

          // Preparamos el comentario actualizado
          // conservando su fecha de creación.
          const editedComment = new Comment({
            id: existingComment?.id ?? 0,
            reviewId: original.id,
            content: input.comment,
            createdAt: existingComment?.createdAt ?? new Date().toISOString(),
          });

          // Primero actualizamos las estrellas.
          return this.reviewApi.updateReview(updatedReview).pipe(
            switchMap((savedReview) => {
              // Si existe el comentario, lo editamos.
              // De lo contrario, creamos el primero.
              const saveComment = existingComment
                ? this.commentApi.updateComment(editedComment)
                : this.commentApi.createComment(editedComment);

              return saveComment.pipe(
                map((savedComment) => this.mapReview(savedReview, [savedComment])),

                // Si falla el comentario, intentamos
                // restaurar la calificación original.
                catchError((error: unknown) =>
                  this.reviewApi.updateReview(original).pipe(
                    catchError(() => of(original)),

                    switchMap(() => throwError(() => error)),
                  ),
                ),
              );
            }),
          );
        }),

        tap((item) => this.upsert(item)),

        catchError((error: unknown) => {
          this.setError(error, 'No se pudo actualizar la reseña.');

          return throwError(() => error);
        }),

        finalize(() => this.loadingSignal.set(false)),
      );
    });
  }

  /**
   * Elimina los comentarios relacionados
   * y después elimina la reseña.
   */
  deleteReviewRequest(id: number): Observable<void> {
    if (!Number.isSafeInteger(id) || id <= 0) {
      return throwError(() => new Error('Identificador de reseña inválido.'));
    }

    this.errorSignal.set(null);
    this.loadingSignal.set(true);

    return this.commentApi.getComments().pipe(
      switchMap((comments) => {
        const related = comments.filter((comment) => comment.reviewId === id);

        // Si no tiene comentarios, continuamos.
        if (related.length === 0) {
          return of([]);
        }

        // Eliminamos los comentarios asociados.
        return forkJoin(related.map((comment) => this.commentApi.deleteComment(comment.id)));
      }),

      // Después eliminamos la reseña.
      switchMap(() => this.reviewApi.deleteReview(id)),

      // Actualizamos el estado local.
      tap(() => {
        this.reviewsSignal.update((reviews) => reviews.filter((review) => review.id !== id));
      }),

      catchError((error: unknown) => {
        this.setError(error, 'No se pudo eliminar la reseña.');

        return throwError(() => error);
      }),

      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Mantiene la compatibilidad con
   * el componente ReviewList existente.
   */
  deleteReview(id: number): void {
    this.deleteReviewRequest(id).subscribe({
      error: () => {
        // El error ya está guardado en errorSignal.
      },
    });
  }
}
