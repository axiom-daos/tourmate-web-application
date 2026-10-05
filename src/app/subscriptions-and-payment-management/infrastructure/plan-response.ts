import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a plan in the API.
 */
export interface PlanResource extends BaseResource {
  id: number;
  name: string;
  priceAmount: number;
  priceCurrency: string;
  features?: { description: string; value: string }[];
}

/**
 * Response envelope for plan collection queries.
 */
export interface PlansResponse extends BaseResponse {
  plans: PlanResource[];
}
