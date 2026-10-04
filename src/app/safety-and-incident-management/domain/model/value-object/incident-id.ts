/**
 * Represents a unique identifier for an Incident value object.
 */
export class IncidentId {
  #value: string;

  /**
   * Creates an instance of IncidentId with the provided value.
   * @param value
   */
  constructor(value: string) {
    this.#value = value;
  }

  /**
   * Returns the value of the IncidentId.
   */
  get value(): string {
    return this.#value;
  }

  /**
   * Returns the string representation of the IncidentId.
   */
  getStringValue(): string {
    return this.#value;
  }

  /**
   * Checks if this IncidentId is equal to another IncidentId.
   * @param other
   */
  equals(other: IncidentId): boolean {
    if (!other) return false;
    return this.#value === other.value;
  }

  /**
   * Generates a new unique IncidentId using UUID v4 format.
   * @returns A new instance of IncidentId with a unique value.
   */
  static generate(): IncidentId {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    return new IncidentId(uuid);
  }
}
