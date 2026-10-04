import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Subscription } from '../domain/model/subscription.entity';
import { SubscriptionResource, SubscriptionsResponse } from './subscription-response';
import { SubscriptionStatus } from '../domain/model/value-object/subscription-status';

/**
 * Maps subscription entities to and from API resources.
 */
export class SubscriptionAssembler implements BaseAssembler<
  Subscription,
  SubscriptionResource,
  SubscriptionsResponse
> {
  toEntitiesFromResponse = (response: SubscriptionsResponse): Subscription[] => {
    return (response.subscriptions || []).map((resource) => this.toEntityFromResource(resource));
  };

  toEntityFromResource = (resource: SubscriptionResource): Subscription => {
    return new Subscription({
      id: resource.id,
      agencyId: resource.agencyId,
      planId: resource.planId,
      status: resource.status as SubscriptionStatus,
      activatedAt: resource.activatedAt,
    });
  };

  toResourceFromEntity = (entity: Subscription): SubscriptionResource => {
    return {
      id: entity.id,
      agencyId: entity.agencyId,
      planId: entity.planId,
      status: entity.status.toString(),
      activatedAt: entity.activatedAt,
    };
  };
}
