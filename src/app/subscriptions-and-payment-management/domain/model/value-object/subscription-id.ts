/**
 * Represents a unique identifier for a Subscription value object.
 */
export class SubscriptionId {
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

  equals(other: SubscriptionId): boolean {
    if (!other) return false;
    return this.#value === other.value;
  }

  static generate(): SubscriptionId {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    return new SubscriptionId(uuid);
  }
}
