import {BaseEntity} from '../../../shared/domain/model/base-entity';

export class TourSchedule implements BaseEntity {

  #id: number
  #tourId: number
  #departureDateTime: string
  #maxCapacity: number
  #status: string


  constructor(tourSchedule: {id: number, tourId: number, departureDateTime: string, maxCapacity: number, status: string}) {

    this.#id = tourSchedule.id
    this.#tourId = tourSchedule.tourId
    this.#departureDateTime = tourSchedule.departureDateTime
    this.#maxCapacity = tourSchedule.maxCapacity
    this.#status = tourSchedule.status
  }


  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get tourId(): number {
    return this.#tourId;
  }

  set tourId(value: number) {
    this.#tourId = value;
  }

  get departureDateTime(): string {
    return this.#departureDateTime;
  }

  set departureDateTime(value: string) {
    this.#departureDateTime = value;
  }

  get maxCapacity(): number {
    return this.#maxCapacity;
  }

  set maxCapacity(value: number) {
    this.#maxCapacity = value;
  }

  get status(): string {
    return this.#status;
  }

  set status(value: string) {
    this.#status = value;
  }
}
