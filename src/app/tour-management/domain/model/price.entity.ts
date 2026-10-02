export class Price {

  #amount: number
  #currency: string


  constructor(price: { amount: number, currency: string }) {
    this.#amount = price.amount
    this.#currency = price.currency
  }


  get amount(): number {
    return this.#amount;
  }

  set amount(value: number) {
    this.#amount = value;
  }

  get currency(): string {
    return this.#currency;
  }

  set currency(value: string) {
    this.#currency = value;
  }
}
