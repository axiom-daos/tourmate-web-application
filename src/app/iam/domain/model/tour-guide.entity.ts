import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class TourGuide implements BaseEntity {
  #id: number;
  #userId: number;
  #agencyId: number;
  #languages: string[];
  #phoneNumber: string;

  constructor(tourGuide: {
    id: number;
    userId: number;
    agencyId: number;
    languages: string[];
    phoneNumber: string;
  }) {
    this.#id = tourGuide.id;
    this.#userId = tourGuide.userId;
    this.#agencyId = tourGuide.agencyId;
    this.#languages = [...tourGuide.languages];
    this.#phoneNumber = tourGuide.phoneNumber;
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
    this.#userId = value;
  }

  get agencyId(): number {
    return this.#agencyId;
  }

  set agencyId(value: number) {
    this.#agencyId = value;
  }

  get languages(): string[] {
    return [...this.#languages];
  }

  set languages(value: string[]) {
    this.#languages = [...value];
  }

  get phoneNumber(): string {
    return this.#phoneNumber;
  }

  set phoneNumber(value: string) {
    this.#phoneNumber = value;
  }
}
