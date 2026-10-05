import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a payment in the API.
 */
export interface PaymentResource extends BaseResource {
  id: number;
  agencyId: number;
  planId: number;
  amount: number;
  currency: string;
  status: string;
  requestedAt: string;
}

/**
 * Response envelope for payment collection queries.
 */
export interface PaymentsResponse extends BaseResponse {
  payments: PaymentResource[];
}
