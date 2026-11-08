import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Represents the data required to create a Comment.
 */
export interface CommentData {
  id: number;
  reviewId: number;
  content: string;
  createdAt: string;
}

/**
 * Represents a comment associated with a tour review.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
export class Comment implements BaseEntity {
  #id: number;
  #reviewId: number;
  #content: string;
  #createdAt: string;

  constructor(comment: CommentData) {
    Comment.validateId(comment.id);
    Comment.validateReviewId(comment.reviewId);
    Comment.validateContent(comment.content);

    this.#id = comment.id;
    this.#reviewId = comment.reviewId;
    this.#content = comment.content.trim();
    this.#createdAt = comment.createdAt;
  }

  /**
   * Validates the comment identifier.
   * Zero is allowed for comments not yet persisted.
   */
  static validateId(id: number): void {
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new Error('El identificador del comentario es inválido.');
    }
  }

  /**
   * Validates the associated review identifier.
   */
  static validateReviewId(reviewId: number): void {
    if (!Number.isSafeInteger(reviewId) || reviewId <= 0) {
      throw new Error('El identificador de la reseña es inválido.');
    }
  }

  /**
   * Validates the comment content.
   */
  static validateContent(content: string): void {
    const cleanContent = content?.trim() ?? '';

    if (cleanContent.length < 5) {
      throw new Error('El comentario debe tener al menos 5 caracteres.');
    }
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    Comment.validateId(value);
    this.#id = value;
  }

  get reviewId(): number {
    return this.#reviewId;
  }

  set reviewId(value: number) {
    Comment.validateReviewId(value);
    this.#reviewId = value;
  }

  get content(): string {
    return this.#content;
  }

  set content(value: string) {
    Comment.validateContent(value);
    this.#content = value.trim();
  }

  get createdAt(): string {
    return this.#createdAt;
  }

  set createdAt(value: string) {
    this.#createdAt = value;
  }
}
