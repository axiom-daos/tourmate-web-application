import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Payment } from '../domain/model/payment.entity';
import { PaymentResource, PaymentsResponse } from './payment-response';
import { PaymentAssembler } from './payment-assembler';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, catchError, map } from 'rxjs';

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
      `${environment.paymentsApiBaseUrl}${environment.tourmateProviderPaymentsEndpointPath}`,
      new PaymentAssembler(),
    );
  }

  override create(payment: Payment): Observable<Payment> {
    const payload = {
      agencyId: Number(payment.agencyId),
      planId: Number(payment.planId),
      amount: Number(payment.amount),
      currency: payment.currency || 'USD',
      transactionReference: `REC-${Date.now().toString().slice(-6)}`,
      status: payment.status.toString(),
      requestedAt: payment.requestedAt || new Date().toISOString(),
    };
    return this.http.post<PaymentResource>(this.endpointUrl, payload).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to record payment')),
    );
  }

  getByAgencyId(agencyId: number): Observable<Payment[]> {
    const url = `${this.endpointUrl}?agencyId=${agencyId}`;
    return this.http.get<PaymentsResponse | PaymentResource[]>(url).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map((resource) => this.assembler.toEntityFromResource(resource));
        }
        return this.assembler.toEntitiesFromResponse(response);
      }),
      catchError(this.handleError('Failed to fetch payments by agency')),
    );
  }
}
