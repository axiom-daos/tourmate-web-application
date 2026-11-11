import { describe, it, expect } from 'vitest';

import { Comment } from './comment.entity';

/**
 * Pruebas unitarias de la entidad Comment.
 *
 * Verificamos sus validaciones y que durante
 * la edición solamente pueda cambiar el texto.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
describe('Comment Entity', () => {
  // Datos válidos utilizados en las pruebas.
  const validComment = {
    id: 1,
    reviewId: 2,
    content: 'El tour estuvo excelente',
    createdAt: '2026-11-08T12:00:00Z',
  };

  /**
   * PRUEBA 1:
   * Se debe crear un comentario válido.
   */
  it('debe crear un comentario con datos válidos', () => {
    const comment = new Comment(validComment);

    expect(comment.id).toBe(1);
    expect(comment.reviewId).toBe(2);
    expect(comment.content).toBe('El tour estuvo excelente');
    expect(comment.createdAt).toBe(validComment.createdAt);
  });

  /**
   * PRUEBA 2:
   * No permitimos comentarios con menos
   * de cinco caracteres útiles.
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
   * No permitimos comentarios vacíos
   * ni formados solamente por espacios.
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
   * Se deben eliminar los espacios
   * innecesarios del comentario.
   */
  it('debe eliminar espacios externos', () => {
    const comment = new Comment({
      ...validComment,
      content: '  Excelente experiencia  ',
    });

    expect(comment.content).toBe('Excelente experiencia');
  });

  /**
   * PRUEBA 5:
   * El comentario debe pertenecer
   * a una reseña con ID válido.
   */
  it('debe rechazar identificadores de reseña inválidos', () => {
    expect(() => {
      Comment.validateReviewId(0);
    }).toThrow();

    expect(() => {
      Comment.validateReviewId(-1);
    }).toThrow();

    expect(() => {
      Comment.validateReviewId(1.5);
    }).toThrow();

    expect(() => {
      Comment.validateReviewId(NaN);
    }).toThrow();
  });

  /**
   * PRUEBA 6:
   * El ID cero está permitido cuando
   * todavía no se guardó el comentario.
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
   * No permitimos identificadores inválidos.
   */
  it('debe rechazar IDs de comentario inválidos', () => {
    expect(() => {
      Comment.validateId(-1);
    }).toThrow();

    expect(() => {
      Comment.validateId(1.5);
    }).toThrow();

    expect(() => {
      Comment.validateId(Infinity);
    }).toThrow();
  });

  /**
   * PRUEBA 8:
   * Se debe poder modificar el contenido
   * de un comentario existente.
   */
  it('debe permitir actualizar el comentario', () => {
    const comment = new Comment(validComment);

    comment.content = 'Muy buena experiencia';

    expect(comment.content).toBe('Muy buena experiencia');
  });

  /**
   * PRUEBA 9:
   * Un contenido inválido no debe modificar
   * el texto que ya estaba guardado.
   */
  it('debe conservar el contenido si la edición es inválida', () => {
    const comment = new Comment(validComment);

    expect(() => {
      comment.content = 'Mal';
    }).toThrow();

    expect(comment.content).toBe(validComment.content);
  });

  /**
   * PRUEBA 10:
   * El texto editado debe guardarse
   * sin espacios externos.
   */
  it('debe limpiar espacios al editar el comentario', () => {
    const comment = new Comment(validComment);

    comment.content = '  Recorrido muy agradable  ';

    expect(comment.content).toBe('Recorrido muy agradable');
  });

  /**
   * PRUEBA 11:
   * La reseña relacionada debe conservarse
   * después de editar el comentario.
   */
  it('debe conservar reviewId durante la edición', () => {
    const comment = new Comment(validComment);

    comment.content = 'Experiencia mejorable';

    expect(comment.reviewId).toBe(2);
  });

  /**
   * PRUEBA 12:
   * La entidad no debe tener un setter
   * que permita cambiar reviewId.
   */
  it('no debe permitir reasignar la reseña', () => {
    const property = Object.getOwnPropertyDescriptor(Comment.prototype, 'reviewId');

    expect(property?.get).toBeTypeOf('function');

    expect(property?.set).toBeUndefined();
  });

  /**
   * PRUEBA 13:
   * La fecha original de creación debe
   * conservarse después de editar.
   */
  it('debe conservar la fecha de creación', () => {
    const comment = new Comment(validComment);

    comment.content = 'Muy buen recorrido';

    expect(comment.createdAt).toBe(validComment.createdAt);
  });

  /**
   * PRUEBA 14:
   * No debe existir un setter público
   * para modificar createdAt.
   */
  it('no debe permitir cambiar createdAt', () => {
    const property = Object.getOwnPropertyDescriptor(Comment.prototype, 'createdAt');

    expect(property?.get).toBeTypeOf('function');

    expect(property?.set).toBeUndefined();
  });

  /**
   * PRUEBA 15:
   * Permitimos asignar el identificador
   * generado por la API.
   */
  it('debe permitir asignar un ID válido', () => {
    const comment = new Comment({
      ...validComment,
      id: 0,
    });

    comment.id = 25;

    expect(comment.id).toBe(25);
  });

  /**
   * PRUEBA 16:
   * Una asignación inválida de ID no
   * debe modificar el identificador anterior.
   */
  it('debe conservar el ID si el nuevo es inválido', () => {
    const comment = new Comment(validComment);

    expect(() => {
      comment.id = -5;
    }).toThrow();

    expect(comment.id).toBe(1);
  });

  /**
   * PRUEBA 17:
   * Comprobamos que exactamente cinco
   * caracteres útiles sean suficientes.
   */
  it('debe aceptar el mínimo de cinco caracteres', () => {
    expect(() => {
      Comment.validateContent('Malo!');
    }).not.toThrow();
  });

  /**
   * PRUEBA 18:
   * Los valores que no son texto
   * no deben aceptarse como comentario.
   */
  it('debe rechazar contenido que no sea texto', () => {
    expect(() => {
      Comment.validateContent(null as unknown as string);
    }).toThrow();

    expect(() => {
      Comment.validateContent(12345 as unknown as string);
    }).toThrow();
  });
});
