import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Payment } from '../domain/model/payment.entity';
import { PaymentResource, PaymentsResponse } from './payment-response';
import { PaymentAssembler } from './payment-assembler';
import { HttpClient } from '@angular/common/http';
import {environment} from '../../../environments/environment';


/**
 * Endpoint client for Payment CRUD operations.
 */
export class PaymentsApiEndpoint extends BaseApiEndpoint<
  Payment,
  PaymentResource,
  PaymentsResponse,
  PaymentAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.tourmateProviderApiBaseUrl}${environment.tourmateProviderPaymentsEndpointPath}`,
      new PaymentAssembler(),
    );
  }
}
