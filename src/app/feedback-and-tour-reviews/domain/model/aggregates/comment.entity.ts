
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Represents a Comment associated with a Review.
 */
export class Comment implements BaseEntity {
  #id: number;
  #reviewId: number;
  #content: string;
  #createdAt: string;

  constructor(comment: {
    id: number;
    reviewId: number;
    content: string;
    createdAt: string;
  }) {
    this.#id = comment.id;
    this.#reviewId = comment.reviewId;
    this.#content = comment.content;
    this.#createdAt = comment.createdAt;
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get reviewId(): number {
    return this.#reviewId;
  }

  set reviewId(value: number) {
    this.#reviewId = value;
  }

  get content(): string {
    return this.#content;
  }

  set content(value: string) {
    this.#content = value;
  }

  get createdAt(): string {
    return this.#createdAt;
  }

  set createdAt(value: string) {
    this.#createdAt = value;
  }
}
