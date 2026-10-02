import {BaseEntity} from '../../../shared/domain/model/base-entity';
import {TourDetails} from './tour-details.entity';

export class Tour implements BaseEntity {

  #id: number
  #agencyId: number
  #details: TourDetails
  #status: string

  constructor(tour: { id: number, agencyId: number, details: TourDetails, status: string }) {

    this.#id = tour.id
    this.#agencyId = tour.agencyId
    this.#details = tour.details
    this.#status = tour.status
  }


  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get agencyId(): number {
    return this.#agencyId;
  }

  set agencyId(value: number) {
    this.#agencyId = value;
  }

  get details(): TourDetails {
    return this.#details;
  }

  set details(value: TourDetails) {
    this.#details = value;
  }

  get status(): string {
    return this.#status;
  }

  set status(value: string) {
    this.#status = value;
  }
}
