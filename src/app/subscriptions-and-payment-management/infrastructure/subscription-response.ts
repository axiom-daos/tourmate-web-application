import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a subscription in the API.
 */
export interface SubscriptionResource extends BaseResource {
  id: number;
  agencyId: number;
  planId: number;
  status: string;
  activatedAt: string | null;
}

/**
 * Response envelope for subscription collection queries.
 */
export interface SubscriptionsResponse extends BaseResponse {
  subscriptions: SubscriptionResource[];
}
