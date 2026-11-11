import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Subscription } from '../domain/model/subscription.entity';
import { SubscriptionResource, SubscriptionsResponse } from './subscription-response';
import { SubscriptionAssembler } from './subscription-assembler';
import { HttpClient } from '@angular/common/http';
import {environment} from '../../../environments/environment';


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
}
