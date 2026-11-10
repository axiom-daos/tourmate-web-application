import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

import { ReviewStore } from './review.store';
import { Review } from '../domain/model/aggregates/review.entity';
import { Comment } from '../domain/model/aggregates/comment.entity';

import { ReviewApi } from '../infrastructure/review-api';
import { CommentApi } from '../infrastructure/comment-api';

/**
 * Pruebas unitarias de ReviewStore.
 *
 * Verifican las operaciones CRUD y las reglas
 * de negocio utilizando MockAPI simuladas.
 *
 * No se hacen peticiones HTTP reales.
 */
describe('ReviewStore', () => {
  let store: ReviewStore;

  // Fechas fijas para comprobar su conservación.
  const fechaReview = '2026-11-08T12:00:00Z';
  const fechaComment = '2026-11-09T12:00:00Z';

  // Mock de la API de reseñas.
  const reviewApiMock = {
    getReviews: vi.fn(),
    getReview: vi.fn(),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
  };

  // Mock de la API de comentarios.
  const commentApiMock = {
    getComments: vi.fn(),
    getComment: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
  };

  /**
   * Crea una reseña válida para las pruebas.
   */
  function crearResena(id = 1, rating = 5, userId = 2, tourId = 3): Review {
    return new Review({
      id,
      userId,
      tourId,
      rating,
      createdAt: fechaReview,
    });
  }

  /**
   * Crea un comentario asociado a una reseña.
   */
  function crearComentario(id = 10, reviewId = 1, content = 'Excelente experiencia'): Comment {
    return new Comment({
      id,
      reviewId,
      content,
      createdAt: fechaComment,
    });
  }

  /**
   * Genera datos válidos para una operación.
   */
  function input(rating = 5, comment = 'Excelente experiencia') {
    return {
      userId: 2,
      tourId: 3,
      rating,
      comment,
    };
  }

  /**
   * Carga una reseña en el Store.
   */
  function cargarResena(): void {
    reviewApiMock.getReviews.mockReturnValue(of([crearResena()]));

    commentApiMock.getComments.mockReturnValue(of([crearComentario()]));

    store.loadData();
  }

  /**
   * Preparamos las dependencias antes
   * de ejecutar cada prueba.
   */
  beforeEach(() => {
    vi.resetAllMocks();

    reviewApiMock.getReviews.mockReturnValue(of([]));
    commentApiMock.getComments.mockReturnValue(of([]));

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
   * Verificamos el estado inicial.
   */
  it('1. comienza con el estado vacío', () => {
    expect(store.reviews()).toEqual([]);
    expect(store.reviewCount()).toBe(0);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  /**
   * PRUEBA 2:
   * Carga reseñas y comentarios por reviewId.
   */
  it('2. carga reseñas y sus comentarios relacionados por reviewId', () => {
    cargarResena();

    expect(store.reviews()).toHaveLength(1);

    expect(store.reviews()[0].commentId).toBe(10);

    expect(store.reviews()[0].comment).toBe('Excelente experiencia');

    expect(store.reviewCount()).toBe(1);
    expect(store.loading()).toBe(false);
  });

  /**
   * PRUEBA 3:
   * Comprueba el manejo de errores de carga.
   */
  it('3. informa errores al cargar las reseñas', () => {
    reviewApiMock.getReviews.mockReturnValue(throwError(() => new Error('Error de conexión')));

    store.loadData();

    expect(store.error()).toBe('Error de conexión');
    expect(store.loading()).toBe(false);
  });

  /**
   * PRUEBA 4:
   * Recupera una reseña aunque no esté
   * cargada previamente en el Store.
   */
  it('4. recupera una reseña por ID aunque no estuviera en memoria', () => {
    reviewApiMock.getReview.mockReturnValue(of(crearResena()));

    commentApiMock.getComments.mockReturnValue(of([crearComentario()]));

    let resultId: number | null = null;

    store.loadReviewById(1).subscribe((item) => {
      resultId = item.id;
    });

    expect(resultId).toBe(1);
    expect(store.reviews()[0].commentId).toBe(10);
  });

  /**
   * PRUEBA 5:
   * Permite registrar una reseña con 0 estrellas.
   */
  it('5. crea una reseña con 0 estrellas y un comentario', () => {
    reviewApiMock.createReview.mockReturnValue(of(crearResena(15, 0)));

    commentApiMock.createComment.mockReturnValue(of(crearComentario(25, 15, 'Experiencia pésima')));

    store.addReview(input(0, 'Experiencia pésima')).subscribe();

    expect(reviewApiMock.getReviews).toHaveBeenCalledOnce();

    expect(reviewApiMock.createReview).toHaveBeenCalledOnce();

    expect(commentApiMock.createComment).toHaveBeenCalledOnce();

    expect(store.reviews()[0].rating).toBe(0);
    expect(store.reviews()[0].commentId).toBe(25);
    expect(store.loading()).toBe(false);
  });

  /**
   * PRUEBA 6:
   * Rechaza estrellas fuera del rango permitido.
   */
  it('6. rechaza calificaciones inválidas sin llamar a la API', () => {
    let error: unknown;

    store.addReview(input(6)).subscribe({
      error: (e) => {
        error = e;
      },
    });

    expect(error).toBeInstanceOf(Error);

    expect(reviewApiMock.getReviews).not.toHaveBeenCalled();

    expect(reviewApiMock.createReview).not.toHaveBeenCalled();
  });

  /**
   * PRUEBA 7:
   * Rechaza una reseña duplicada
   * que ya está cargada en el Store.
   */
  it('7. impide duplicados ya cargados en el Store', () => {
    cargarResena();

    let error: unknown;

    store.addReview(input(4)).subscribe({
      error: (e) => {
        error = e;
      },
    });

    expect((error as Error).message).toContain('ya ha dejado una reseña');

    expect(reviewApiMock.createReview).not.toHaveBeenCalled();
  });

  /**
   * PRUEBA 8:
   * Rechaza duplicados que están en MockAPI,
   * aunque todavía no estén cargados en pantalla.
   */
  it('8. impide duplicados que existen en MockAPI aunque la lista local esté vacía', () => {
    reviewApiMock.getReviews.mockReturnValue(of([crearResena()]));

    let error: unknown;

    store.addReview(input(4)).subscribe({
      error: (e) => {
        error = e;
      },
    });

    expect((error as Error).message).toContain('ya ha dejado una reseña');

    expect(reviewApiMock.createReview).not.toHaveBeenCalled();

    expect(store.reviews()).toEqual([]);
  });

  /**
   * PRUEBA 9:
   * Dos usuarios diferentes pueden
   * reseñar el mismo tour.
   */
  it('9. admite usuarios distintos en un mismo tour', () => {
    reviewApiMock.getReviews.mockReturnValue(of([crearResena()]));

    reviewApiMock.createReview.mockReturnValue(of(crearResena(20, 3, 9, 3)));

    commentApiMock.createComment.mockReturnValue(of(crearComentario(30, 20)));

    store
      .addReview({
        userId: 9,
        tourId: 3,
        rating: 3,
        comment: 'Recorrido aceptable',
      })
      .subscribe();

    expect(reviewApiMock.createReview).toHaveBeenCalledOnce();

    expect(store.reviews()[0].userId).toBe(9);
  });

  /**
   * PRUEBA 10:
   * Evita dos creaciones simultáneas iguales
   * dentro de una misma instancia del Store.
   */
  it('10. evita dos creaciones simultáneas del mismo usuario y tour', () => {
    const pendientes = new Subject<Review[]>();

    reviewApiMock.getReviews.mockReturnValue(pendientes.asObservable());

    let error: unknown;

    const first = store.addReview(input()).subscribe({
      error: () => {},
    });

    store.addReview(input()).subscribe({
      error: (e) => {
        error = e;
      },
    });

    expect((error as Error).message).toContain('ya ha dejado una reseña');

    expect(reviewApiMock.getReviews).toHaveBeenCalledOnce();

    first.unsubscribe();
  });

  /**
   * PRUEBA 11:
   * Si falla la creación del comentario,
   * intenta borrar la reseña recién creada.
   */
  it('11. intenta borrar la reseña si falla la creación del comentario', () => {
    reviewApiMock.createReview.mockReturnValue(of(crearResena(20)));

    commentApiMock.createComment.mockReturnValue(throwError(() => new Error('Falló comentario')));

    reviewApiMock.deleteReview.mockReturnValue(of(void 0));

    let error: unknown;

    store.addReview(input()).subscribe({
      error: (e) => {
        error = e;
      },
    });

    expect(reviewApiMock.deleteReview).toHaveBeenCalledWith(20);

    expect(error).toBeInstanceOf(Error);

    expect(store.reviews()).toHaveLength(0);
    expect(store.loading()).toBe(false);
  });

  /**
   * PRUEBA 12:
   * Al editar solo cambian las estrellas
   * y el texto del comentario.
   */
  it('12. edita solo estrellas y comentario manteniendo usuario, tour y fechas', () => {
    cargarResena();

    reviewApiMock.getReview.mockReturnValue(of(crearResena()));

    reviewApiMock.updateReview.mockReturnValue(of(crearResena(1, 0)));

    commentApiMock.updateComment.mockReturnValue(
      of(crearComentario(10, 1, 'Muy mala experiencia')),
    );

    store
      .updateReview({
        id: 1,
        ...input(0, 'Muy mala experiencia'),
        commentId: 10,
      })
      .subscribe();

    expect(reviewApiMock.getReview).toHaveBeenCalledWith(1);

    expect(reviewApiMock.updateReview).toHaveBeenCalledOnce();

    const sentReview = reviewApiMock.updateReview.mock.calls[0][0] as Review;

    const sentComment = commentApiMock.updateComment.mock.calls[0][0] as Comment;

    expect(sentReview.userId).toBe(2);
    expect(sentReview.tourId).toBe(3);
    expect(sentReview.createdAt).toBe(fechaReview);
    expect(sentReview.rating).toBe(0);

    expect(sentComment.reviewId).toBe(1);
    expect(sentComment.createdAt).toBe(fechaComment);

    expect(store.reviews()[0].rating).toBe(0);
    expect(store.reviews()[0].comment).toBe('Muy mala experiencia');
  });

  /**
   * PRUEBA 13:
   * No permite cambiar el usuario
   * durante la edición de una reseña.
   */
  it('13. rechaza cambiar el usuario durante la edición', () => {
    reviewApiMock.getReview.mockReturnValue(of(crearResena()));

    let error: unknown;

    store
      .updateReview({
        id: 1,
        ...input(4),
        userId: 99,
      })
      .subscribe({
        error: (e) => {
          error = e;
        },
      });

    expect((error as Error).message).toContain('No se puede cambiar el usuario ni el tour');

    expect(reviewApiMock.updateReview).not.toHaveBeenCalled();

    expect(commentApiMock.updateComment).not.toHaveBeenCalled();
  });

  /**
   * PRUEBA 14:
   * No permite cambiar el tour
   * durante la edición de una reseña.
   */
  it('14. rechaza cambiar el tour durante la edición', () => {
    reviewApiMock.getReview.mockReturnValue(of(crearResena()));

    let error: unknown;

    store
      .updateReview({
        id: 1,
        ...input(4),
        tourId: 99,
      })
      .subscribe({
        error: (e) => {
          error = e;
        },
      });

    expect((error as Error).message).toContain('No se puede cambiar el usuario ni el tour');

    expect(reviewApiMock.updateReview).not.toHaveBeenCalled();
  });

  /**
   * PRUEBA 15:
   * Permite editar una reseña que todavía
   * no estaba cargada en el estado local.
   */
  it('15. edita una reseña sin requerir que se haya cargado en la lista', () => {
    reviewApiMock.getReview.mockReturnValue(of(crearResena()));

    commentApiMock.getComments.mockReturnValue(of([crearComentario()]));

    reviewApiMock.updateReview.mockReturnValue(of(crearResena(1, 4)));

    commentApiMock.updateComment.mockReturnValue(of(crearComentario(10, 1, 'Experiencia buena')));

    store
      .updateReview({
        id: 1,
        ...input(4, 'Experiencia buena'),
      })
      .subscribe();

    expect(store.reviews()[0].commentId).toBe(10);

    expect(commentApiMock.createComment).not.toHaveBeenCalled();
  });

  /**
   * PRUEBA 16:
   * Si falla la segunda petición,
   * intenta restaurar la calificación anterior.
   */
  it('16. intenta restaurar la calificación si falla la actualización del comentario', () => {
    reviewApiMock.getReview.mockReturnValue(of(crearResena()));

    commentApiMock.getComments.mockReturnValue(of([crearComentario()]));

    reviewApiMock.updateReview.mockImplementation((review: Review) => of(review));

    commentApiMock.updateComment.mockReturnValue(
      throwError(() => new Error('Error de comentario')),
    );

    let error: unknown;

    store
      .updateReview({
        id: 1,
        ...input(3, 'Comentario editado'),
      })
      .subscribe({
        error: (e) => {
          error = e;
        },
      });

    expect(reviewApiMock.updateReview).toHaveBeenCalledTimes(2);

    const restored = reviewApiMock.updateReview.mock.calls[1][0] as Review;

    expect(restored.rating).toBe(5);

    expect(error).toBeInstanceOf(Error);

    expect(store.error()).toBe('Error de comentario');
  });

  /**
   * PRUEBA 17:
   * Elimina los comentarios relacionados
   * y posteriormente elimina la reseña.
   */
  it('17. elimina los comentarios asociados y después la reseña', () => {
    cargarResena();

    commentApiMock.getComments.mockReturnValue(of([crearComentario()]));

    commentApiMock.deleteComment.mockReturnValue(of(void 0));

    reviewApiMock.deleteReview.mockReturnValue(of(void 0));

    store.deleteReviewRequest(1).subscribe();

    expect(commentApiMock.deleteComment).toHaveBeenCalledWith(10);

    expect(reviewApiMock.deleteReview).toHaveBeenCalledWith(1);

    expect(store.reviews()).toHaveLength(0);

    expect(store.reviewCount()).toBe(0);
  });

  /**
   * PRUEBA 18:
   * Conserva el estado local si falla
   * la eliminación de la reseña.
   */
  it('18. conserva la reseña en la lista si falla su eliminación', () => {
    cargarResena();

    commentApiMock.getComments.mockReturnValue(of([]));

    reviewApiMock.deleteReview.mockReturnValue(throwError(() => new Error('Error del servidor')));

    let error: unknown;

    store.deleteReviewRequest(1).subscribe({
      error: (e) => {
        error = e;
      },
    });

    expect(error).toBeInstanceOf(Error);

    expect(store.error()).toBe('Error del servidor');

    expect(store.reviews()).toHaveLength(1);

    expect(store.loading()).toBe(false);
  });
});
