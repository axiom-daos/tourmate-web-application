/**
 * Represents a unique identifier for a Payment value object.
 */
export class PaymentId {
  #value: string;

  constructor(value: string) {
    this.#value = value;
  }

  get value(): string {
    return this.#value;
  }

  getStringValue(): string {
    return this.#value;
  }

  equals(other: PaymentId): boolean {
    if (!other) return false;
    return this.#value === other.value;
  }

  static generate(): PaymentId {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    return new PaymentId(uuid);
  }
}
