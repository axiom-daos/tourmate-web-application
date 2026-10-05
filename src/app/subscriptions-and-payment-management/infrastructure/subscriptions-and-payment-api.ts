import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Plan } from '../domain/model/plan.entity';
import { Subscription } from '../domain/model/subscription.entity';
import { Payment } from '../domain/model/payment.entity';
import { PlansApiEndpoint } from './plans-api-endpoint';
import { SubscriptionsApiEndpoint } from './subscriptions-api-endpoint';
import { PaymentsApiEndpoint } from './payments-api-endpoint';

/**
 * Infrastructure facade for subscriptions and payment endpoint operations.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionsAndPaymentApi extends BaseApi {
  private readonly http = inject(HttpClient);

  private readonly plansEndpoint = new PlansApiEndpoint(this.http);
  private readonly subscriptionsEndpoint = new SubscriptionsApiEndpoint(this.http);
  private readonly paymentsEndpoint = new PaymentsApiEndpoint(this.http);

  // Plan operations
  getPlans = (): Observable<Plan[]> => this.plansEndpoint.getAll();
  getPlan = (id: number): Observable<Plan> => this.plansEndpoint.getById(id);

  // Subscription operations
  getSubscriptions = (): Observable<Subscription[]> => this.subscriptionsEndpoint.getAll();
  getSubscription = (id: number): Observable<Subscription> =>
    this.subscriptionsEndpoint.getById(id);
  createSubscription = (subscription: Subscription): Observable<Subscription> =>
    this.subscriptionsEndpoint.create(subscription);
  updateSubscription = (subscription: Subscription): Observable<Subscription> =>
    this.subscriptionsEndpoint.update(subscription, subscription.id);
  deleteSubscription = (id: number): Observable<void> => this.subscriptionsEndpoint.delete(id);

  // Payment operations
  getPayments = (): Observable<Payment[]> => this.paymentsEndpoint.getAll();
  getPayment = (id: number): Observable<Payment> => this.paymentsEndpoint.getById(id);
  createPayment = (payment: Payment): Observable<Payment> => this.paymentsEndpoint.create(payment);
  updatePayment = (payment: Payment): Observable<Payment> =>
    this.paymentsEndpoint.update(payment, payment.id);
}
