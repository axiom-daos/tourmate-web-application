import {BaseEntity} from '../../../shared/domain/model/base-entity';

export class ActiveTour implements BaseEntity {
  #id: number;
  #tourScheduleId: number;
  #guideId: number;
  #status: string;
  #currentLatitude: number;
  #currentLongitude: number;
  #startedAt: string;
  #finishedAt: string | null;

  constructor(activeTour:
              { id: number;
                tourScheduleId: number;
                guideId: number;
                status: string;
                currentLatitude: number;
                currentLongitude: number;
                startedAt: string;
                finishedAt: string }) {
    this.#id = activeTour.id;
    this.#tourScheduleId = activeTour.tourScheduleId;
    this.#guideId = activeTour.guideId;
    this.#status = activeTour.status;
    this.#currentLatitude = activeTour.currentLatitude;
    this.#currentLongitude = activeTour.currentLongitude;
    this.#startedAt = activeTour.startedAt;
    this.#finishedAt = activeTour.finishedAt;
  }

  get id(): number {
    return this.#id;
  }
  set id(value: number) {
    this.#id = value;
  }

  get tourScheduleId(): number {
    return this.#tourScheduleId;
  }
  set tourScheduleId(value: number) {
    this.#tourScheduleId = value;
  }

  get guideId(): number {
    return this.#guideId;
  }
  set guideId(value: number) {
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
