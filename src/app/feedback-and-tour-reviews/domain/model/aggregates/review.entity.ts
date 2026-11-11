import { BaseEntity } from '../../../../shared/domain/model/base-entity';
export interface ReviewData {
  id: number;
  userId: number;
  tourId: number;
  rating: number;
  createdAt: string;
}

export class Review implements BaseEntity {
  // Identificador de la reseña.
  #id: number;

  // Usuario propietario de la reseña.
  // No puede modificarse después de la creación.
  readonly #userId: number;

  // Tour al que pertenece la reseña.
  // No puede modificarse después de la creación.
  readonly #tourId: number;

  // Calificación de 0 a 5 estrellas.
  #rating: number;

  // Fecha original de creación.
  readonly #createdAt: string;

  /**
   * Constructor de una reseña.
   *
   * Valida los datos antes de crear el agregado.
   */
  constructor(review: ReviewData) {
    // Validamos el identificador.
    Review.validateId(review.id);

    // Validamos el usuario y el tour.
    Review.validateIds(review.userId, review.tourId);

    // Validamos la calificación.
    Review.validateRating(review.rating);

    // Inicializamos las propiedades.
    this.#id = review.id;
    this.#userId = review.userId;
    this.#tourId = review.tourId;
    this.#rating = review.rating;
    this.#createdAt = review.createdAt;
  }

  /**
   * Valida el identificador de una reseña.
   *
   * Se permite ID igual a cero para una
   * reseña todavía no guardada en la API.
   */
  static validateId(id: number): void {
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new Error('El identificador de la reseña es inválido.');
    }
  }

  /**
   * Comprueba los identificadores del usuario
   * y del tour.
   *
   * Ambos deben ser enteros positivos.
   */
  static validateIds(userId: number, tourId: number): void {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new Error('El usuario de la reseña es inválido.');
    }

    if (!Number.isSafeInteger(tourId) || tourId <= 0) {
      throw new Error('El tour de la reseña es inválido.');
    }
  }

  /**
   * Valida la calificación de una reseña.
   *
   * Se permiten valores enteros de 0 a 5.
   *
   * 0 representa una experiencia pésima.
   * Un valor nulo no equivale a 0 estrellas.
   */
  static validateRating(rating: number): void {
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      throw new Error('La calificación debe estar entre 0 y 5.');
    }
  }

  /**
   * Valida el contenido del comentario asociado.
   *
   * Se conserva este método por compatibilidad
   * con las operaciones actuales de ReviewStore.
   *
   * El comentario debe tener al menos
   * cinco caracteres sin contar espacios externos.
   */
  static validateComment(comment: string): void {
    const cleanComment = comment?.trim() ?? '';

    if (cleanComment.length < 5) {
      throw new Error('El comentario debe tener al menos 5 caracteres.');
    }
  }

  /**
   * Obtiene el identificador de la reseña.
   */
  get id(): number {
    return this.#id;
  }

  /**
   * Permite asignar el ID generado por la API.
   */
  set id(value: number) {
    Review.validateId(value);

    this.#id = value;
  }

  /**
   * Obtiene el usuario propietario.
   *
   * No existe un setter porque el propietario
   * no puede cambiar después de la creación.
   */
  get userId(): number {
    return this.#userId;
  }

  /**
   * Obtiene el tour relacionado.
   *
   * No existe un setter porque la reseña
   * siempre debe pertenecer al tour original.
   */
  get tourId(): number {
    return this.#tourId;
  }

  /**
   * Obtiene la calificación.
   */
  get rating(): number {
    return this.#rating;
  }

  /**
   * Actualiza únicamente la calificación.
   *
   * El valor debe encontrarse entre 0 y 5.
   */
  set rating(value: number) {
    // Primero validamos la nueva calificación.
    Review.validateRating(value);

    // Actualizamos el valor.
    this.#rating = value;
  }

  /**
   * Obtiene la fecha original de creación.
   *
   * No permitimos modificarla durante la edición.
   */
  get createdAt(): string {
    return this.#createdAt;
  }
}
