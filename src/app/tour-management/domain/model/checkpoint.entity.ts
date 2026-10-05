import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class Checkpoint implements BaseEntity {
  #id: number;
  #tourId: number;
  #name: string;
  #latitude: number;
  #longitude: number;
  #orderIndex: number;
  #description: string;

  constructor(checkpoint: {
    id: number;
    tourId: number;
    name: string;
    latitude: number;
    longitude: number;
    orderIndex: number;
    description: string;
  }) {
    this.#id = checkpoint.id;
    this.#tourId = checkpoint.tourId;
    this.#name = checkpoint.name;
    this.#latitude = checkpoint.latitude;
    this.#longitude = checkpoint.longitude;
    this.#orderIndex = checkpoint.orderIndex;
    this.#description = checkpoint.description;
  }

  get id(): number { return this.#id; }
  set id(value: number) { this.#id = value; }

  get tourId(): number { return this.#tourId; }
  set tourId(value: number) { this.#tourId = value; }

  get name(): string { return this.#name; }
  set name(value: string) { this.#name = value; }

  get latitude(): number { return this.#latitude; }
  set latitude(value: number) { this.#latitude = value; }

  get longitude(): number { return this.#longitude; }
  set longitude(value: number) { this.#longitude = value; }

  get orderIndex(): number { return this.#orderIndex; }
  set orderIndex(value: number) { this.#orderIndex = value; }

  get description(): string { return this.#description; }
  set description(value: string) { this.#description = value; }
}
