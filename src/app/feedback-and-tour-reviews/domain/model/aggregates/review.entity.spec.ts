import { describe, it, expect } from 'vitest';

import { Review } from './review.entity';

/**
 * Pruebas unitarias de la entidad Review.
 *
 * Verificamos que las reglas de negocio de las
 * reseñas funcionen correctamente.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
describe('Review Entity', () => {
  // Datos válidos que utilizaremos en las pruebas.
  const validReview = {
    id: 1,
    userId: 2,
    tourId: 3,
    rating: 5,
    createdAt: '2026-11-08T12:00:00Z',
  };

  /**
   * PRUEBA 1:
   * Comprobamos que se pueda crear una reseña
   * cuando todos sus datos son correctos.
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
   * Verificamos que se acepten calificaciones
   * desde 1 hasta 5 estrellas.
   */
  it('debe aceptar calificaciones entre 1 y 5', () => {
    for (let rating = 1; rating <= 5; rating++) {
      expect(() => {
        Review.validateRating(rating);
      }).not.toThrow();
    }
  });

  /**
   * PRUEBA 3:
   * Comprobamos que no se permitan calificaciones
   * menores que 1, mayores que 5 o decimales.
   */
  it('debe rechazar calificaciones inválidas', () => {
    expect(() => Review.validateRating(0)).toThrow();

    expect(() => Review.validateRating(6)).toThrow();

    expect(() => Review.validateRating(-1)).toThrow();

    expect(() => Review.validateRating(2.5)).toThrow();

    expect(() => Review.validateRating(NaN)).toThrow();
  });

  /**
   * PRUEBA 4:
   * Los identificadores de usuario y tour
   * deben ser números enteros positivos.
   */
  it('debe rechazar identificadores inválidos', () => {
    expect(() => Review.validateIds(0, 1)).toThrow();

    expect(() => Review.validateIds(1, -1)).toThrow();

    expect(() => Review.validateIds(1.5, 2)).toThrow();

    expect(() => Review.validateIds(1, 0)).toThrow();
  });

  /**
   * PRUEBA 5:
   * Permitimos ID igual a cero cuando una reseña
   * todavía no ha sido guardada en la API.
   */
  it('debe permitir una reseña nueva con ID cero', () => {
    const review = new Review({
      ...validReview,
      id: 0,
    });

    expect(review.id).toBe(0);
  });

  /**
   * PRUEBA 6:
   * Comprobamos que los comentarios demasiado
   * cortos o vacíos sean rechazados.
   */
  it('debe rechazar comentarios inválidos', () => {
    expect(() => {
      Review.validateComment('Hola');
    }).toThrow();

    expect(() => {
      Review.validateComment('   ');
    }).toThrow();

    expect(() => {
      Review.validateComment('');
    }).toThrow();
  });

  /**
   * PRUEBA 7:
   * Verificamos que los comentarios que tengan
   * cinco caracteres o más sean aceptados.
   */
  it('debe aceptar comentarios válidos', () => {
    expect(() => {
      Review.validateComment('Excelente tour');
    }).not.toThrow();

    expect(() => {
      Review.validateComment('Muy bueno');
    }).not.toThrow();
  });

  /**
   * PRUEBA 8:
   * Comprobamos que se pueda modificar
   * correctamente la calificación.
   */
  it('debe actualizar una calificación válida', () => {
    const review = new Review(validReview);

    review.rating = 4;

    expect(review.rating).toBe(4);
  });

  /**
   * PRUEBA 9:
   * Si se intenta colocar una calificación
   * inválida, conservamos la anterior.
   */
  it('debe impedir actualizar con una calificación inválida', () => {
    const review = new Review(validReview);

    expect(() => {
      review.rating = 8;
    }).toThrow();

    expect(review.rating).toBe(5);
  });
});
