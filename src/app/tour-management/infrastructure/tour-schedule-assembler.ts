import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {TourSchedule} from '../domain/model/tour-schedule.entity';
import {TourScheduleResource, TourSchedulesResponse} from './tour-schedule-response';

export class TourScheduleAssembler implements BaseAssembler<TourSchedule, TourScheduleResource, TourSchedulesResponse>{

    toEntityFromResource(resource: TourScheduleResource): TourSchedule {
        return new TourSchedule(
          {
            id: resource.id,
            tourId: resource.tourId,
            departureDateTime: resource.departureDatetime,
            maxCapacity: resource.maxCapacity,
            status: resource.status
          }
        )
    }


    toResourceFromEntity(entity: TourSchedule): TourScheduleResource {

      return {
        id: entity.id,
        tourId: entity.tourId,
        departureDatetime: entity.departureDateTime,
        maxCapacity: entity.maxCapacity,
        status: entity.status
      }
    }

    toEntitiesFromResponse(response: TourSchedulesResponse): TourSchedule[] {
      return response.tour_schedules.map(resource => this.toEntityFromResource(resource))
    }
}
