import { describe, it, expect } from 'vitest';

import { Review } from './review.entity';

/**
 * Pruebas unitarias del agregado Review.
 *
 */
describe('Review Entity', () => {
  // Datos válidos utilizados en las pruebas.
  const validReview = {
    id: 1,
    userId: 2,
    tourId: 3,
    rating: 5,
    createdAt: '2026-11-08T12:00:00Z',
  };

  /**
   * PRUEBA 1:
   * Verificamos que se pueda crear una reseña válida.
   */
  it('debe crear una reseña con datos válidos', () => {
    const review = new Review(validReview);

    expect(review.id).toBe(1);
    expect(review.userId).toBe(2);
    expect(review.tourId).toBe(3);
    expect(review.rating).toBe(5);
    expect(review.createdAt).toBe(validReview.createdAt);
  });

  /**
   * PRUEBA 2:
   * Se aceptan calificaciones enteras de 0 a 5.
   */
  it('debe aceptar calificaciones de 0 a 5 estrellas', () => {
    for (let rating = 0; rating <= 5; rating++) {
      expect(() => {
        Review.validateRating(rating);
      }).not.toThrow();
    }
  });

  /**
   * PRUEBA 3:
   * Verificamos que 0 estrellas sea una
   * calificación válida al crear una reseña.
   */
  it('debe permitir crear una reseña con 0 estrellas', () => {
    const review = new Review({
      ...validReview,
      rating: 0,
    });

    expect(review.rating).toBe(0);
  });

  /**
   * PRUEBA 4:
   * Rechazamos calificaciones fuera del rango
   * permitido o con valores decimales.
   */
  it('debe rechazar calificaciones inválidas', () => {
    expect(() => Review.validateRating(-1)).toThrow();

    expect(() => Review.validateRating(6)).toThrow();

    expect(() => Review.validateRating(2.5)).toThrow();

    expect(() => Review.validateRating(NaN)).toThrow();

    expect(() => Review.validateRating(Infinity)).toThrow();
  });

  /**
   * PRUEBA 5:
   * Un valor nulo no debe interpretarse
   * como una calificación de cero estrellas.
   */
  it('debe rechazar una calificación no seleccionada', () => {
    expect(() => {
      Review.validateRating(null as unknown as number);
    }).toThrow();
  });

  /**
   * PRUEBA 6:
   * Verificamos que el usuario y el tour
   * tengan identificadores válidos.
   */
  it('debe rechazar identificadores inválidos', () => {
    expect(() => Review.validateIds(0, 1)).toThrow();

    expect(() => Review.validateIds(1, 0)).toThrow();

    expect(() => Review.validateIds(-1, 2)).toThrow();

    expect(() => Review.validateIds(2, -1)).toThrow();

    expect(() => Review.validateIds(1.5, 2)).toThrow();
  });

  /**
   * PRUEBA 7:
   * Permitimos ID cero para una reseña
   * que todavía no ha sido persistida.
   */
  it('debe permitir una reseña nueva con ID cero', () => {
    const review = new Review({
      ...validReview,
      id: 0,
    });

    expect(review.id).toBe(0);
  });

  /**
   * PRUEBA 8:
   * Los identificadores negativos no son válidos.
   */
  it('debe rechazar un ID de reseña inválido', () => {
    expect(() => {
      new Review({
        ...validReview,
        id: -1,
      });
    }).toThrow();
  });

  /**
   * PRUEBA 9:
   * No permitimos comentarios demasiado
   * cortos, vacíos o formados por espacios.
   */
  it('debe rechazar comentarios inválidos', () => {
    expect(() => {
      Review.validateComment('Mal');
    }).toThrow();

    expect(() => {
      Review.validateComment('   ');
    }).toThrow();

    expect(() => {
      Review.validateComment('');
    }).toThrow();
  });

  /**
   * PRUEBA 10:
   * Permitimos comentarios que tengan
   * como mínimo cinco caracteres útiles.
   */
  it('debe aceptar comentarios válidos', () => {
    expect(() => {
      Review.validateComment('Malo!');
    }).not.toThrow();

    expect(() => {
      Review.validateComment('Excelente experiencia');
    }).not.toThrow();
  });

  /**
   * PRUEBA 11:
   * Verificamos que la calificación
   * pueda modificarse correctamente.
   */
  it('debe actualizar una calificación válida', () => {
    const review = new Review(validReview);

    review.rating = 4;

    expect(review.rating).toBe(4);
  });

  /**
   * PRUEBA 12:
   * Debe permitirse cambiar una calificación
   * de 5 estrellas a 0 estrellas.
   */
  it('debe permitir actualizar la calificación a cero', () => {
    const review = new Review(validReview);

    review.rating = 0;

    expect(review.rating).toBe(0);
  });

  /**
   * PRUEBA 13:
   * Una calificación inválida no debe
   * modificar el valor anterior.
   */
  it('debe conservar la calificación si la nueva es inválida', () => {
    const review = new Review(validReview);

    expect(() => {
      review.rating = 8;
    }).toThrow();

    expect(review.rating).toBe(5);
  });

  /**
   * PRUEBA 14:
   * Al modificar las estrellas, el usuario,
   * el tour y la fecha deben permanecer iguales.
   */
  it('debe conservar usuario, tour y fecha al editar', () => {
    const review = new Review(validReview);

    review.rating = 2;

    expect(review.userId).toBe(2);
    expect(review.tourId).toBe(3);
    expect(review.createdAt).toBe(validReview.createdAt);
  });

  /**
   * PRUEBA 15:
   * El agregado no debe ofrecer métodos setter
   * para modificar el usuario o el tour.
   */
  it('no debe permitir reasignar usuario ni tour', () => {
    const userProperty = Object.getOwnPropertyDescriptor(Review.prototype, 'userId');

    const tourProperty = Object.getOwnPropertyDescriptor(Review.prototype, 'tourId');

    expect(userProperty?.get).toBeTypeOf('function');
    expect(tourProperty?.get).toBeTypeOf('function');

    expect(userProperty?.set).toBeUndefined();
    expect(tourProperty?.set).toBeUndefined();
  });

  /**
   * PRUEBA 16:
   * El agregado no debe permitir modificar
   * la fecha original mediante un setter.
   */
  it('no debe permitir modificar la fecha de creación', () => {
    const dateProperty = Object.getOwnPropertyDescriptor(Review.prototype, 'createdAt');

    expect(dateProperty?.get).toBeTypeOf('function');
    expect(dateProperty?.set).toBeUndefined();
  });
});
