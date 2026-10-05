import { BaseEntity } from '../../../../shared/domain/model/base-entity';

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
  }

  get id(): number { return this.#id; }
  set id(value: number) { this.#id = value; }

  get userId(): number { return this.#userId; }
  set userId(value: number) { this.#userId = value; }

  get tourId(): number { return this.#tourId; }
  set tourId(value: number) { this.#tourId = value; }

  get rating(): number { return this.#rating; }
  set rating(value: number) { this.#rating = value; }

  get createdAt(): string { return this.#createdAt; }
  set createdAt(value: string) { this.#createdAt = value; }
}
