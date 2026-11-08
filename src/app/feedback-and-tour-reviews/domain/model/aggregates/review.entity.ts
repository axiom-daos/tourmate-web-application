import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Represents a Review aggregate in the
 * feedback and tour reviews domain model.
 */
export class Review implements BaseEntity {
  #id: number;
  #userId: number;
  #tourId: number;
  #rating: number;
  #createdAt: string;

  constructor(review: {
    id: number;
    userId: number;
    tourId: number;
    rating: number;
    createdAt: string;
  }) {
    this.#id = review.id;
    this.#userId = review.userId;
    this.#tourId = review.tourId;
    this.#rating = review.rating;
    this.#createdAt = review.createdAt;

    Review.validateIds(this.#userId, this.#tourId);
    Review.validateRating(this.#rating);
  }

  static validateIds(userId: number, tourId: number): void {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('El usuario de la reseña es inválido.');
    }

    if (!Number.isInteger(tourId) || tourId <= 0) {
      throw new Error('El tour de la reseña es inválido.');
    }
  }

  static validateRating(rating: number): void {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('La calificación debe estar entre 1 y 5.');
    }
  }

  static validateComment(comment: string): void {
    const cleanComment = comment?.trim() ?? '';

    if (cleanComment.length < 5) {
      throw new Error('El comentario debe tener al menos 5 caracteres.');
    }
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get userId(): number {
    return this.#userId;
  }

  set userId(value: number) {
    Review.validateIds(value, this.#tourId);
    this.#userId = value;
  }

  get tourId(): number {
    return this.#tourId;
  }

  set tourId(value: number) {
    Review.validateIds(this.#userId, value);
    this.#tourId = value;
  }

  get rating(): number {
    return this.#rating;
  }

  set rating(value: number) {
    Review.validateRating(value);
    this.#rating = value;
  }

  get createdAt(): string {
    return this.#createdAt;
  }

  set createdAt(value: string) {
    this.#createdAt = value;
  }
}
