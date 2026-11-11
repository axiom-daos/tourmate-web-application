import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Representa los datos necesarios para un comentario.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
export interface CommentData {
  id: number;
  reviewId: number;
  content: string;
  createdAt: string;
}

/**
 * Entidad del dominio que representa un comentario
 * asociado a una reseña turística.
 *
 * Reglas del negocio:
 * - El comentario pertenece a una reseña válida.
 * - La reseña relacionada no puede modificarse.
 * - El contenido debe tener al menos 5 caracteres.
 * - Durante la edición solo cambia el contenido.
 * - La fecha original de creación se conserva.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
export class Comment implements BaseEntity {
  // Identificador único del comentario.
  #id: number;

  // Identificador de la reseña relacionada.
  // No puede cambiar después de crear el comentario.
  readonly #reviewId: number;

  // Texto escrito por el usuario.
  #content: string;

  // Fecha original de creación.
  // No puede cambiar durante la edición.
  readonly #createdAt: string;

  /**
   * Constructor de la entidad Comment.
   *
   * Comprueba los datos antes de crear
   * el comentario.
   */
  constructor(comment: CommentData) {
    // Validamos el identificador del comentario.
    Comment.validateId(comment.id);

    // Validamos la reseña relacionada.
    Comment.validateReviewId(comment.reviewId);

    // Validamos el contenido ingresado.
    Comment.validateContent(comment.content);

    // Inicializamos las propiedades.
    this.#id = comment.id;
    this.#reviewId = comment.reviewId;
    this.#content = comment.content.trim();
    this.#createdAt = comment.createdAt;
  }

  /**
   * Valida el identificador de un comentario.
   *
   * Se permite ID igual a cero cuando
   * todavía no ha sido guardado en MockAPI.
   */
  static validateId(id: number): void {
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new Error('El identificador del comentario es inválido.');
    }
  }

  /**
   * Valida el identificador de la reseña.
   *
   * Debe ser un entero positivo porque
   * el comentario necesita una reseña existente.
   */
  static validateReviewId(reviewId: number): void {
    if (!Number.isSafeInteger(reviewId) || reviewId <= 0) {
      throw new Error('El identificador de la reseña es inválido.');
    }
  }

  /**
   * Valida el texto del comentario.
   *
   * Debe contener al menos cinco caracteres
   * sin contar los espacios de los extremos.
   */
  static validateContent(content: string): void {
    // Rechazamos valores que no sean texto.
    if (typeof content !== 'string') {
      throw new Error('El comentario debe contener un texto válido.');
    }

    // Eliminamos espacios externos para validar.
    const cleanContent = content.trim();

    if (cleanContent.length < 5) {
      throw new Error('El comentario debe tener al menos 5 caracteres.');
    }
  }

  /**
   * Obtiene el identificador del comentario.
   */
  get id(): number {
    return this.#id;
  }

  /**
   * Permite asignar el ID generado por la API.
   *
   * No representa una operación de edición
   * realizada por el usuario.
   */
  set id(value: number) {
    Comment.validateId(value);

    this.#id = value;
  }

  /**
   * Obtiene el identificador de la reseña.
   *
   * No existe un setter porque el comentario
   * no puede transferirse a otra reseña.
   */
  get reviewId(): number {
    return this.#reviewId;
  }

  /**
   * Obtiene el contenido del comentario.
   */
  get content(): string {
    return this.#content;
  }

  /**
   * Actualiza únicamente el contenido.
   *
   * Primero validamos el nuevo texto.
   * Si es inválido, se conserva el anterior.
   */
  set content(value: string) {
    // Comprobamos que el texto sea válido.
    Comment.validateContent(value);

    // Actualizamos el texto sin espacios externos.
    this.#content = value.trim();
  }

  /**
   * Obtiene la fecha original de creación.
   *
   * No existe un setter porque la fecha
   * debe permanecer igual después de editar.
   */
  get createdAt(): string {
    return this.#createdAt;
  }
}
