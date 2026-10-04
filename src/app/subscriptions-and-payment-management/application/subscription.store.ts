import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { SubscriptionsAndPaymentApi } from '../infrastructure/subscriptions-and-payment-api';
import { Plan } from '../domain/model/plan.entity';
import { Subscription } from '../domain/model/subscription.entity';
import { Payment } from '../domain/model/payment.entity';
import { SubscriptionStatus } from '../domain/model/value-object/subscription-status';
import { PaymentStatus } from '../domain/model/value-object/payment-status';

/**
 * Holds subscription and payment application state and coordinates behavior.
 */
@Injectable({
  providedIn: 'root',
})
export class SubscriptionStore {
  private readonly api = inject(SubscriptionsAndPaymentApi);

  // Agency identifier for demo / current session (Agency 1 by default)
  readonly currentAgencyId: WritableSignal<number> = signal<number>(1);

  // Core signals
  private readonly plansSignal = signal<Plan[]>([]);
  readonly plans: Signal<Plan[]> = this.plansSignal.asReadonly();

  private readonly subscriptionsSignal = signal<Subscription[]>([]);
  readonly subscriptions: Signal<Subscription[]> = this.subscriptionsSignal.asReadonly();

  private readonly paymentsSignal = signal<Payment[]>([]);
  readonly payments: Signal<Payment[]> = this.paymentsSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading: Signal<boolean> = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error: Signal<string | null> = this.errorSignal.asReadonly();

  // Computed state
  readonly currentSubscription: Signal<Subscription | undefined> = computed(() => {
    const agencyId = this.currentAgencyId();
    const subs = this.subscriptions().filter((s) => s.agencyId === agencyId);
    return subs.find((s) => s.status === SubscriptionStatus.ACTIVE) ?? subs[0];
  });

  readonly currentPlan: Signal<Plan | undefined> = computed(() => {
    const sub = this.currentSubscription();
    if (!sub) return undefined;
    return this.plans().find((p) => p.id === sub.planId);
  });

  readonly currentAgencyPayments: Signal<Payment[]> = computed(() => {
    const agencyId = this.currentAgencyId();
    return this.payments()
      .filter((p) => p.agencyId === agencyId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  });

  constructor() {
    this.loadAll();
  }

  /**
   * Loads all initial data (plans, subscriptions, payments).
   */
  loadAll(): void {
    this.loadPlans();
    this.loadSubscriptions();
    this.loadPayments();
  }

  /**
   * Loads all available subscription plans.
   */
  loadPlans(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api
      .getPlans()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (plans) => {
          this.plansSignal.set(plans);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load plans'));
          this.loadingSignal.set(false);
        },
      });
  }

  /**
   * Loads all subscriptions.
   */
  loadSubscriptions(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api
      .getSubscriptions()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (subs) => {
          this.subscriptionsSignal.set(subs);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load subscriptions'));
          this.loadingSignal.set(false);
        },
      });
  }

  /**
   * Loads all payments history.
   */
  loadPayments(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api
      .getPayments()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (payments) => {
          this.paymentsSignal.set(payments);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load payments'));
          this.loadingSignal.set(false);
        },
      });
  }

  /**
   * Subscribes or upgrades to a new plan.
   * @param plan
   */
  subscribeToPlan(plan: Plan): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const agencyId = this.currentAgencyId();
    const existingSub = this.currentSubscription();

    const timestamp = new Date().toISOString();

    if (existingSub) {
      // Update existing subscription
      existingSub.planId = plan.id;
      existingSub.status = SubscriptionStatus.ACTIVE;
      existingSub.activatedAt = timestamp;

      this.api
        .updateSubscription(existingSub)
        .pipe(retry(2))
        .subscribe({
          next: (updated) => {
            this.subscriptionsSignal.update((subs) =>
              subs.map((s) => (s.id === updated.id ? updated : s)),
            );
            this.recordPayment(agencyId, plan.id, plan.priceAmount, plan.priceCurrency);
          },
          error: (err) => {
            this.errorSignal.set(this.formatError(err, 'Failed to update subscription'));
            this.loadingSignal.set(false);
          },
        });
    } else {
      // Create new subscription
      const newSub = new Subscription({
        id: Date.now(),
        agencyId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        activatedAt: timestamp,
      });

      this.api
        .createSubscription(newSub)
        .pipe(retry(2))
        .subscribe({
          next: (created) => {
            this.subscriptionsSignal.update((subs) => [...subs, created]);
            this.recordPayment(agencyId, plan.id, plan.priceAmount, plan.priceCurrency);
          },
          error: (err) => {
            this.errorSignal.set(this.formatError(err, 'Failed to create subscription'));
            this.loadingSignal.set(false);
          },
        });
    }
  }

  /**
   * Cancels the active subscription.
   */
  cancelSubscription(): void {
    const sub = this.currentSubscription();
    if (!sub) return;

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    sub.cancel();

    this.api
      .updateSubscription(sub)
      .pipe(retry(2))
      .subscribe({
        next: (updated) => {
          this.subscriptionsSignal.update((subs) =>
            subs.map((s) => (s.id === updated.id ? updated : s)),
          );
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to cancel subscription'));
          this.loadingSignal.set(false);
        },
      });
  }

  /**
   * Records a payment transaction for an agency.
   * @private
   */
  private recordPayment(agencyId: number, planId: number, amount: number, currency: string): void {
    const newPayment = new Payment({
      id: Date.now(),
      agencyId,
      planId,
      amount,
      currency,
      status: PaymentStatus.PAID,
      requestedAt: new Date().toISOString(),
    });

    this.api
      .createPayment(newPayment)
      .pipe(retry(2))
      .subscribe({
        next: (created) => {
          this.paymentsSignal.update((payments) => [...payments, created]);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Payment succeeded but failed to record log'));
          this.loadingSignal.set(false);
        },
      });
  }

  /**
   * Formats error message gracefully.
   * @private
   */
  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }
}
