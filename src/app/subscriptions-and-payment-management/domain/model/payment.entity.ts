import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { PaymentStatus } from './value-object/payment-status';

/**
 * Represents a Payment aggregate root in the payment domain.
 */
export class Payment implements BaseEntity {
  #id: number;
  #agencyId: number;
  #planId: number;
  #amount: number;
  #currency: string;
  #status: PaymentStatus;
  #requestedAt: string;

  constructor(payment: {
    id: number;
    agencyId: number;
    planId: number;
    amount: number;
    currency: string;
    status: PaymentStatus | string;
    requestedAt?: string;
  }) {
    this.#id = payment.id;
    this.#agencyId = payment.agencyId;
    this.#planId = payment.planId;
    this.#amount = payment.amount;
    this.#currency = payment.currency;
    this.#requestedAt = payment.requestedAt ?? new Date().toISOString();
    this.#status =
      typeof payment.status === 'string'
        ? (PaymentStatus[payment.status as keyof typeof PaymentStatus] ?? PaymentStatus.PAID)
        : payment.status;
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

  get planId(): number {
    return this.#planId;
  }

  set planId(value: number) {
    this.#planId = value;
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

  get status(): PaymentStatus {
    return this.#status;
  }

  set status(value: PaymentStatus) {
    this.#status = value;
  }

  get requestedAt(): string {
    return this.#requestedAt;
  }

  set requestedAt(value: string) {
    this.#requestedAt = value;
  }

  /**
   * Domain behavior to mark payment as processed/paid.
   */
  process(): void {
    this.#status = PaymentStatus.PAID;
  }

  /**
   * Domain behavior to reject payment.
   */
  reject(): void {
    this.#status = PaymentStatus.REJECTED;
  }
}
