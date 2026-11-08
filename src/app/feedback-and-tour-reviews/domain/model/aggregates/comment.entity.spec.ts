import { describe, it, expect } from 'vitest';

import { Comment } from './comment.entity';

/**
 * Pruebas unitarias de la entidad Comment.
 *
 * Verificamos que las reglas de negocio
 * relacionadas con los comentarios funcionen.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
describe('Comment Entity', () => {
  // Datos válidos para nuestras pruebas.
  const validComment = {
    id: 1,
    reviewId: 2,
    content: 'El tour estuvo excelente',
    createdAt: '2026-11-08T12:00:00Z',
  };

  /**
   * PRUEBA 1:
   * Verificamos que se pueda crear un comentario
   * cuando todos sus datos son válidos.
   */
  it('debe crear un comentario válido', () => {
    const comment = new Comment(validComment);

    expect(comment.id).toBe(1);

    expect(comment.reviewId).toBe(2);

    expect(comment.content).toBe('El tour estuvo excelente');

    expect(comment.createdAt).toBe(validComment.createdAt);
  });

  /**
   * PRUEBA 2:
   * Comprobamos que un comentario con menos
   * de cinco caracteres sea rechazado.
   */
  it('debe rechazar comentarios demasiado cortos', () => {
    expect(() => {
      new Comment({
        ...validComment,
        content: 'Mal',
      });
    }).toThrow();
  });

  /**
   * PRUEBA 3:
   * Verificamos que no se acepten comentarios
   * vacíos o que solamente tengan espacios.
   */
  it('debe rechazar comentarios vacíos', () => {
    expect(() => {
      new Comment({
        ...validComment,
        content: '',
      });
    }).toThrow();

    expect(() => {
      new Comment({
        ...validComment,
        content: '     ',
      });
    }).toThrow();
  });

  /**
   * PRUEBA 4:
   * Comprobamos que se eliminen los espacios
   * al inicio y al final del comentario.
   */
  it('debe eliminar espacios innecesarios', () => {
    const comment = new Comment({
      ...validComment,
      content: '  Excelente experiencia  ',
    });

    expect(comment.content).toBe('Excelente experiencia');
  });

  /**
   * PRUEBA 5:
   * El comentario debe estar asociado
   * con una reseña que tenga un ID válido.
   */
  it('debe rechazar identificadores de reseña inválidos', () => {
    expect(() => {
      new Comment({
        ...validComment,
        reviewId: 0,
      });
    }).toThrow();

    expect(() => {
      new Comment({
        ...validComment,
        reviewId: -1,
      });
    }).toThrow();
  });

  /**
   * PRUEBA 6:
   * Permitimos ID cero cuando un comentario
   * todavía no ha sido guardado en la API.
   */
  it('debe permitir crear comentarios con ID cero', () => {
    const comment = new Comment({
      ...validComment,
      id: 0,
    });

    expect(comment.id).toBe(0);
  });

  /**
   * PRUEBA 7:
   * Verificamos que el contenido de un
   * comentario pueda actualizarse correctamente.
   */
  it('debe permitir actualizar un comentario válido', () => {
    const comment = new Comment(validComment);

    comment.content = 'Muy buena experiencia';

    expect(comment.content).toBe('Muy buena experiencia');
  });

  /**
   * PRUEBA 8:
   * Impedimos modificar un comentario con un
   * texto que no cumple la longitud mínima.
   */
  it('debe impedir actualizar con contenido inválido', () => {
    const comment = new Comment(validComment);

    expect(() => {
      comment.content = 'Mal';
    }).toThrow();

    // El contenido anterior debe conservarse.
    expect(comment.content).toBe(validComment.content);
  });

  /**
   * PRUEBA 9:
   * Comprobamos que se pueda actualizar la
   * reseña asociada utilizando un ID válido.
   */
  it('debe permitir actualizar el ID de la reseña', () => {
    const comment = new Comment(validComment);

    comment.reviewId = 5;

    expect(comment.reviewId).toBe(5);

    // No debe aceptar IDs negativos.
    expect(() => {
      comment.reviewId = -3;
    }).toThrow();

    expect(comment.reviewId).toBe(5);
  });
});
