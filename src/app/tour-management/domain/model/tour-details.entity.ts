import {Price} from './price.entity';

export class TourDetails {

  #title: string
  #description: string
  #duration: string
  #difficulty: string
  #price: Price

  constructor(tourDetails: { title: string, description: string, duration: string, difficulty: string, price: Price }) {

    this.#title = tourDetails.title
    this.#description = tourDetails.description
    this.#duration = tourDetails.duration
    this.#difficulty = tourDetails.difficulty
    this.#price = tourDetails.price
  }


  get title(): string {
    return this.#title;
  }

  set title(value: string) {
    this.#title = value;
  }

  get description(): string {
    return this.#description;
  }

  set description(value: string) {
    this.#description = value;
  }

  get duration(): string {
    return this.#duration;
  }

  set duration(value: string) {
    this.#duration = value;
  }

  get difficulty(): string {
    return this.#difficulty;
  }

  set difficulty(value: string) {
    this.#difficulty = value;
  }

  get price(): Price {
    return this.#price;
  }

  set price(value: Price) {
    this.#price = value;
  }
}
