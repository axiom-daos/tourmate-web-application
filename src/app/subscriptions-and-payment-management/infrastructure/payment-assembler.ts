import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Payment } from '../domain/model/payment.entity';
import { PaymentResource, PaymentsResponse } from './payment-response';
import { PaymentStatus } from '../domain/model/value-object/payment-status';

/**
 * Maps payment entities to and from API resources.
 */
export class PaymentAssembler implements BaseAssembler<Payment, PaymentResource, PaymentsResponse> {
  toEntitiesFromResponse = (response: PaymentsResponse): Payment[] => {
    return (response.payments || []).map((resource) => this.toEntityFromResource(resource));
  };

  toEntityFromResource = (resource: PaymentResource): Payment => {
    return new Payment({
      id: resource.id,
      agencyId: resource.agencyId,
      planId: resource.planId,
      amount: resource.amount,
      currency: resource.currency,
      status: resource.status as PaymentStatus,
      requestedAt: resource.requestedAt,
    });
  };

  toResourceFromEntity = (entity: Payment): PaymentResource => {
    return {
      id: entity.id,
      agencyId: entity.agencyId,
      planId: entity.planId,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status.toString(),
      requestedAt: entity.requestedAt,
    };
  };
}
