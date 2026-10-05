import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {Tour} from '../domain/model/tour.entity';
import {TourResource, ToursResponse} from './tour-response';
import {TourDetails} from '../domain/model/tour-details.entity';
import {Price} from '../domain/model/price.entity';


export class TourAssembler implements BaseAssembler<Tour, TourResource, ToursResponse>{


    toEntityFromResource(resource: TourResource): Tour {
      return new Tour({
        id: resource.id,
        agencyId: resource.agencyId,
        details: new TourDetails({
          title: resource.title,
          description: resource.description,
          duration: resource.duration,
          difficulty: resource.difficulty,
          price: new Price({
            amount: resource.priceAmount,
            currency: resource.priceCurrency
          })
        }),
        status: resource.status
      })
    }


  toResourceFromEntity(entity: Tour): TourResource {
    return {
      id: entity.id,
      agencyId: entity.agencyId,
      title: entity.details.title,
      description: entity.details.description,
      duration: entity.details.duration,
      difficulty: entity.details.difficulty,
      priceAmount: entity.details.price.amount,
      priceCurrency: entity.details.price.currency,
      status: entity.status
    }
  }


    toEntitiesFromResponse(response: ToursResponse): Tour[] {
        return response.tours.map(resource => this.toEntityFromResource(resource))
    }

}
