import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { of, throwError } from 'rxjs';

import { ReviewStore } from './review.store';

import { Review } from '../domain/model/aggregates/review.entity';
import { Comment } from '../domain/model/aggregates/comment.entity';

import { ReviewApi } from '../infrastructure/review-api';
import { CommentApi } from '../infrastructure/comment-api';

/**
 * Pruebas unitarias de ReviewStore.
 *
 * Verificamos las operaciones CRUD y las
 * reglas de negocio de reseñas y comentarios.
 *
 * No se realizan peticiones reales a MockAPI.
 * Utilizamos servicios simulados para las pruebas.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
describe('ReviewStore', () => {
  let store: ReviewStore;

  // Fecha fija para mantener resultados consistentes.
  const fecha = '2026-11-08T12:00:00Z';

  /**
   * Simulamos las operaciones de ReviewApi.
   *
   * vi.fn() permite comprobar si un método
   * fue llamado y qué información recibió.
   */
  const reviewApiMock = {
    getReviews: vi.fn(),
    getReview: vi.fn(),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
  };

  /**
   * Simulamos las operaciones de CommentApi.
   */
  const commentApiMock = {
    getComments: vi.fn(),
    getComment: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
  };

  /**
   * Creamos una reseña válida para las pruebas.
   */
  function crearResena(id = 1, rating = 5): Review {
    return new Review({
      id,
      userId: 2,
      tourId: 3,
      rating,
      createdAt: fecha,
    });
  }

  /**
   * Creamos un comentario relacionado con
   * la reseña indicada.
   */
  function crearComentario(
    id = 10,
    reviewId = 1,
    content = 'Excelente experiencia turística',
  ): Comment {
    return new Comment({
      id,
      reviewId,
      content,
      createdAt: fecha,
    });
  }

  /**
   * Antes de cada prueba:
   * 1. Reiniciamos los mocks.
   * 2. Configuramos las dependencias.
   * 3. Creamos una instancia nueva del Store.
   */
  beforeEach(() => {
    vi.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        ReviewStore,

        {
          provide: ReviewApi,
          useValue: reviewApiMock,
        },

        {
          provide: CommentApi,
          useValue: commentApiMock,
        },
      ],
    });

    store = TestBed.inject(ReviewStore);
  });

  /**
   * PRUEBA 1:
   * El Store debe comenzar sin reseñas,
   * sin errores y sin operaciones pendientes.
   */
  it('debe iniciar con el estado vacío', () => {
    expect(store.reviews()).toEqual([]);

    expect(store.reviewCount()).toBe(0);

    expect(store.loading()).toBe(false);

    expect(store.error()).toBeNull();
  });

  /**
   * PRUEBA 2:
   * Verificamos que se carguen las reseñas
   * junto con sus comentarios relacionados.
   */
  it('debe cargar reseñas y comentarios', () => {
    reviewApiMock.getReviews.mockReturnValue(of([crearResena()]));

    commentApiMock.getComments.mockReturnValue(of([crearComentario()]));

    store.loadData();

    expect(store.reviews()).toHaveLength(1);

    expect(store.reviews()[0].rating).toBe(5);

    expect(store.reviews()[0].comment).toBe('Excelente experiencia turística');

    expect(store.reviewCount()).toBe(1);

    expect(store.loading()).toBe(false);
  });

  /**
   * PRUEBA 3:
   * Comprobamos que un error de la API
   * se registre correctamente en el Store.
   */
  it('debe manejar errores al cargar reseñas', () => {
    reviewApiMock.getReviews.mockReturnValue(throwError(() => new Error('Error de conexión')));

    commentApiMock.getComments.mockReturnValue(of([]));

    store.loadData();

    expect(store.error()).toBe('Error de conexión');

    expect(store.loading()).toBe(false);

    expect(store.reviews()).toEqual([]);
  });

  /**
   * PRUEBA 4:
   * Consultamos una reseña directamente por ID,
   * aunque no esté cargada en la lista.
   */
  it('debe cargar una reseña por su ID', () => {
    reviewApiMock.getReview.mockReturnValue(of(crearResena()));

    commentApiMock.getComments.mockReturnValue(of([crearComentario()]));

    let resultadoId: number | null = null;

    store.loadReviewById(1).subscribe({
      next: (review) => {
        resultadoId = review.id;
      },
    });

    expect(resultadoId).toBe(1);

    expect(store.reviews()).toHaveLength(1);

    expect(store.reviews()[0].commentId).toBe(10);

    expect(reviewApiMock.getReview).toHaveBeenCalledWith(1);
  });

  /**
   * PRUEBA 5:
   * Comprobamos la creación de una reseña
   * junto con su comentario.
   */
  it('debe crear una reseña correctamente', () => {
    const nuevaResena = crearResena(15);

    const nuevoComentario = crearComentario(25, 15, 'Un tour realmente maravilloso');

    reviewApiMock.createReview.mockReturnValue(of(nuevaResena));

    commentApiMock.createComment.mockReturnValue(of(nuevoComentario));

    store
      .addReview({
        userId: 2,
        tourId: 3,
        rating: 5,
        comment: 'Un tour realmente maravilloso',
      })
      .subscribe();

    expect(reviewApiMock.createReview).toHaveBeenCalledOnce();

    expect(commentApiMock.createComment).toHaveBeenCalledOnce();

    expect(store.reviews()).toHaveLength(1);

    expect(store.reviews()[0].id).toBe(15);

    expect(store.reviews()[0].commentId).toBe(25);

    expect(store.loading()).toBe(false);
  });

  /**
   * PRUEBA 6:
   * No permitimos crear reseñas con
   * calificaciones fuera del rango de 1 a 5.
   */
  it('debe rechazar una calificación inválida', () => {
    let errorObtenido: unknown;

    store
      .addReview({
        userId: 2,
        tourId: 3,
        rating: 8,
        comment: 'Excelente experiencia',
      })
      .subscribe({
        error: (error) => {
          errorObtenido = error;
        },
      });

    expect(errorObtenido).toBeInstanceOf(Error);

    expect(reviewApiMock.createReview).not.toHaveBeenCalled();

    expect(store.reviews()).toHaveLength(0);
  });

  /**
   * PRUEBA 7:
   * Un usuario no debe crear dos reseñas
   * para el mismo tour dentro del estado cargado.
   */
  it('debe impedir reseñas duplicadas', () => {
    reviewApiMock.getReviews.mockReturnValue(of([crearResena()]));

    commentApiMock.getComments.mockReturnValue(of([crearComentario()]));

    store.loadData();

    let errorObtenido: unknown;

    store
      .addReview({
        userId: 2,
        tourId: 3,
        rating: 4,
        comment: 'Segunda reseña del mismo tour',
      })
      .subscribe({
        error: (error) => {
          errorObtenido = error;
        },
      });

    expect(errorObtenido).toBeInstanceOf(Error);

    expect((errorObtenido as Error).message).toContain('ya ha dejado una reseña');

    expect(reviewApiMock.createReview).not.toHaveBeenCalled();

    expect(store.reviews()).toHaveLength(1);
  });

  /**
   * PRUEBA 8:
   * Si falla la creación del comentario,
   * comprobamos que el Store intente
   * eliminar la reseña recién creada.
   */
  it('debe intentar revertir una creación incompleta', () => {
    reviewApiMock.createReview.mockReturnValue(of(crearResena(20)));

    commentApiMock.createComment.mockReturnValue(
      throwError(() => new Error('Error al crear comentario')),
    );

    reviewApiMock.deleteReview.mockReturnValue(of(void 0));

    let errorObtenido: unknown;

    store
      .addReview({
        userId: 2,
        tourId: 3,
        rating: 5,
        comment: 'Una experiencia excelente',
      })
      .subscribe({
        error: (error) => {
          errorObtenido = error;
        },
      });

    expect(reviewApiMock.deleteReview).toHaveBeenCalledWith(20);

    expect(errorObtenido).toBeInstanceOf(Error);

    expect(store.reviews()).toHaveLength(0);

    expect(store.loading()).toBe(false);
  });

  /**
   * PRUEBA 9:
   * Actualizamos la calificación de una reseña
   * y el contenido de su comentario existente.
   */
  it('debe actualizar una reseña y su comentario', () => {
    reviewApiMock.getReviews.mockReturnValue(of([crearResena()]));

    commentApiMock.getComments.mockReturnValue(of([crearComentario()]));

    store.loadData();

    reviewApiMock.updateReview.mockReturnValue(of(crearResena(1, 4)));

    commentApiMock.updateComment.mockReturnValue(
      of(crearComentario(10, 1, 'Muy buena experiencia turística')),
    );

    store
      .updateReview({
        id: 1,
        userId: 2,
        tourId: 3,
        rating: 4,
        commentId: 10,
        comment: 'Muy buena experiencia turística',
      })
      .subscribe();

    expect(reviewApiMock.updateReview).toHaveBeenCalledOnce();

    expect(commentApiMock.updateComment).toHaveBeenCalledOnce();

    expect(store.reviews()[0].rating).toBe(4);

    expect(store.reviews()[0].comment).toBe('Muy buena experiencia turística');

    expect(store.loading()).toBe(false);
  });

  /**
   * PRUEBA 10:
   * Comprobamos que una reseña pueda
   * eliminarse junto con su comentario.
   */
  it('debe eliminar una reseña correctamente', () => {
    reviewApiMock.getReviews.mockReturnValue(of([crearResena()]));

    commentApiMock.getComments.mockReturnValue(of([crearComentario()]));

    store.loadData();

    commentApiMock.deleteComment.mockReturnValue(of(void 0));

    reviewApiMock.deleteReview.mockReturnValue(of(void 0));

    store.deleteReviewRequest(1).subscribe();

    expect(commentApiMock.deleteComment).toHaveBeenCalledWith(10);

    expect(reviewApiMock.deleteReview).toHaveBeenCalledWith(1);

    expect(store.reviews()).toHaveLength(0);

    expect(store.reviewCount()).toBe(0);

    expect(store.loading()).toBe(false);
  });

  /**
   * PRUEBA 11:
   * Si la API falla al eliminar una reseña,
   * verificamos que se conserve en la lista.
   */
  it('debe conservar la reseña si falla la eliminación', () => {
    reviewApiMock.getReviews.mockReturnValue(of([crearResena()]));

    commentApiMock.getComments.mockReturnValue(of([]));

    store.loadData();

    reviewApiMock.deleteReview.mockReturnValue(throwError(() => new Error('Error del servidor')));

    let errorObtenido: unknown;

    store.deleteReviewRequest(1).subscribe({
      error: (error) => {
        errorObtenido = error;
      },
    });

    expect(errorObtenido).toBeInstanceOf(Error);

    expect(store.error()).toBe('Error del servidor');

    expect(store.reviews()).toHaveLength(1);

    expect(store.loading()).toBe(false);
  });
});
