import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export interface ReviewData {
  id: number;
  userId: number;
  tourId: number;
  rating: number;
  createdAt: string;
}

/**
 * Review aggregate of the Feedback and Tour Reviews
 * bounded context.
 */
export class Review implements BaseEntity {
  #id: number;
  #userId: number;
  #tourId: number;
  #rating: number;
  #createdAt: string;

  constructor(review: ReviewData) {
    Review.validateId(review.id);
    Review.validateIds(review.userId, review.tourId);
    Review.validateRating(review.rating);

    this.#id = review.id;
    this.#userId = review.userId;
    this.#tourId = review.tourId;
    this.#rating = review.rating;
    this.#createdAt = review.createdAt;
  }

  static validateId(id: number): void {
    // ID 0 is allowed for a review not yet persisted.
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new Error('El identificador de la reseña es inválido.');
    }
  }

  static validateIds(userId: number, tourId: number): void {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new Error('El usuario de la reseña es inválido.');
    }

    if (!Number.isSafeInteger(tourId) || tourId <= 0) {
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
    Review.validateId(value);
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
