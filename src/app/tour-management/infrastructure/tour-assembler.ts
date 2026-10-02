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
          title: resource.details.title,
          description: resource.details.description,
          duration: resource.details.duration,
          difficulty: resource.details.difficulty,
          price: new Price(resource.details.price)
        }),
        status: resource.status
      })
    }


    toResourceFromEntity(entity: Tour): TourResource {
        return {
          id: entity.id,
          agencyId: entity.agencyId,
          details: entity.details,
          status: entity.status
        }
    }


    toEntitiesFromResponse(response: ToursResponse): Tour[] {
        return response.tours.map(resource => this.toEntityFromResource(resource))
    }

}
