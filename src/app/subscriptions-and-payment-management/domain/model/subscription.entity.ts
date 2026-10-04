import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { SubscriptionStatus } from './value-object/subscription-status';

/**
 * Represents a Subscription aggregate root in the subscriptions domain.
 */
export class Subscription implements BaseEntity {
  #id: number;
  #agencyId: number;
  #planId: number;
  #status: SubscriptionStatus;
  #activatedAt: string | null;

  constructor(subscription: {
    id: number;
    agencyId: number;
    planId: number;
    status: SubscriptionStatus | string;
    activatedAt?: string | null;
  }) {
    this.#id = subscription.id;
    this.#agencyId = subscription.agencyId;
    this.#planId = subscription.planId;
    this.#activatedAt = subscription.activatedAt ?? null;
    this.#status =
      typeof subscription.status === 'string'
        ? (SubscriptionStatus[subscription.status as keyof typeof SubscriptionStatus] ??
          SubscriptionStatus.ACTIVE)
        : subscription.status;
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

  get status(): SubscriptionStatus {
    return this.#status;
  }

  set status(value: SubscriptionStatus) {
    this.#status = value;
  }

  get activatedAt(): string | null {
    return this.#activatedAt;
  }

  set activatedAt(value: string | null) {
    this.#activatedAt = value;
  }

  /**
   * Domain behavior to cancel the subscription.
   */
  cancel(): void {
    this.#status = SubscriptionStatus.CANCELLED;
  }

  /**
   * Domain behavior to activate the subscription.
   */
  activate(): void {
    this.#status = SubscriptionStatus.ACTIVE;
    if (!this.#activatedAt) {
      this.#activatedAt = new Date().toISOString();
    }
  }
}
