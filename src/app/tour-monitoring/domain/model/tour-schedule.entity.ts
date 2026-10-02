import {BaseEntity} from '../../../shared/domain/model/base-entity';

export class TourSchedule implements BaseEntity {
  #id: number;
  #tourId: number;
  #departureDatetime: string;
  #maxCapacity: number;
  #status: string;

  constructor(tourSchedule:
              { id: number;
                tourId: number;
                departureDatetime: string;
                maxCapacity: number;
                status: string }) {
    this.#id = tourSchedule.id;
    this.#tourId = tourSchedule.tourId;
    this.#departureDatetime = tourSchedule.departureDatetime;
    this.#maxCapacity = tourSchedule.maxCapacity;
    this.#status = tourSchedule.status;
  }

  get id(): number {
    return this.#id;
  }
  set id(value: number) {
    this.#id = value;
  }
  get tourId() {
    return this.#tourId;
  }
  set tourId(value: number) {
    this.#tourId = value;
  }
  get departureDatetime() {
    return this.#departureDatetime;
  }
  set departureDatetime(value: string) {
    this.#departureDatetime = value;
  }
  get maxCapacity() {
    return this.#maxCapacity;
  }
  set maxCapacity(value: number) {
    this.#maxCapacity = value;
  }
  get status() {
    return this.#status;
  }
  set status(value: string) {
    this.#status = value;
  }

}
