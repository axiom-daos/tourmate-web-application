import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Plan } from '../domain/model/plan.entity';
import { PlanResource, PlansResponse } from './plan-response';

/**
 * Maps plan entities to and from API resources.
 */
export class PlanAssembler implements BaseAssembler<Plan, PlanResource, PlansResponse> {
  toEntitiesFromResponse = (response: PlansResponse): Plan[] => {
    return (response.plans || []).map((resource) => this.toEntityFromResource(resource));
  };

  toEntityFromResource = (resource: PlanResource): Plan => {
    return new Plan({
      id: Number(resource.id),
      name: resource.name,
      priceAmount: Number(resource.priceAmount),
      priceCurrency: resource.priceCurrency || 'USD',
      features: resource.features || [],
    });
  };

  toResourceFromEntity = (entity: Plan): PlanResource => {
    return {
      id: entity.id,
      name: entity.name,
      priceAmount: entity.priceAmount,
      priceCurrency: entity.priceCurrency,
      features: entity.features,
    };
  };
}
