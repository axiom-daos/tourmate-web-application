import {BaseEntity} from '../../../shared/domain/model/base-entity';

export class ActiveTours implements BaseEntity {
  #id: number;
  #tourScheduleId: string;
  #guideId: string;
  #status: string;
  #currentLatitude: number;
  #currentLongitude: number;
  #startedAt: string;
  #finishedAt: string | null;

  constructor(activeTours:
              { id: number;
                tourScheduleId: string;
                guideId: string;
                status: string;
                currentLatitude: number;
                currentLongitude: number;
                startedAt: string;
                finishedAt: string }) {
    this.#id = activeTours.id;
    this.#tourScheduleId = activeTours.tourScheduleId;
    this.#guideId = activeTours.guideId;
    this.#status = activeTours.status;
    this.#currentLatitude = activeTours.currentLatitude;
    this.#currentLongitude = activeTours.currentLongitude;
    this.#startedAt = activeTours.startedAt;
    this.#finishedAt = activeTours.finishedAt;
  }

  get id(): number {
    return this.#id;
  }
  set id(value: number) {
    this.#id = value;
  }

  get tourScheduleId(): string {
    return this.#tourScheduleId;
  }
  set tourScheduleId(value: string) {
    this.#tourScheduleId = value;
  }

  get guideId(): string {
    return this.#guideId;
  }
  set guideId(value: string) {
    this.#guideId = value;
  }

  get status(): string {
    return this.#status;
  }
  set status(value: string) {
    this.#status = value;
  }

  get currentLatitude(): number {
    return this.#currentLatitude;
  }
  set currentLatitude(value: number) {
    this.#currentLatitude = value;
  }

  get currentLongitude(): number {
    return this.#currentLongitude;
  }
  set currentLongitude(value: number) {
    this.#currentLongitude = value;
  }

  get startedAt(): string {
    return this.#startedAt;
  }
  set startedAt(value: string) {
    this.#startedAt = value;
  }

  get finishedAt(): string | null {
    return this.#finishedAt;
  }
  set finishedAt(value: string | null) {
    this.#finishedAt = value;
  }
}
