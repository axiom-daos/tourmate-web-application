import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Subscription } from '../domain/model/subscription.entity';
import { SubscriptionResource, SubscriptionsResponse } from './subscription-response';
import { SubscriptionAssembler } from './subscription-assembler';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, catchError, map } from 'rxjs';

/**
 * Endpoint client for Subscription CRUD operations.
 */
export class SubscriptionsApiEndpoint extends BaseApiEndpoint<
  Subscription,
  SubscriptionResource,
  SubscriptionsResponse,
  SubscriptionAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.tourmateProviderApiBaseUrl}${environment.tourmateProviderSubscriptionsEndpointPath}`,
      new SubscriptionAssembler(),
    );
  }

  override create(subscription: Subscription): Observable<Subscription> {
    const payload = {
      agencyId: Number(subscription.agencyId),
      planId: Number(subscription.planId),
      status: subscription.status.toString(),
      activatedAt: subscription.activatedAt || new Date().toISOString(),
    };
    return this.http.post<SubscriptionResource>(this.endpointUrl, payload).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create subscription')),
    );
  }

  getByAgencyId(agencyId: number): Observable<Subscription[]> {
    const url = `${this.endpointUrl}?agencyId=${agencyId}`;
    return this.http.get<SubscriptionsResponse | SubscriptionResource[]>(url).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map((resource) => this.assembler.toEntityFromResource(resource));
        }
        return this.assembler.toEntitiesFromResponse(response);
      }),
      catchError(this.handleError('Failed to fetch subscriptions by agency')),
    );
  }
}
