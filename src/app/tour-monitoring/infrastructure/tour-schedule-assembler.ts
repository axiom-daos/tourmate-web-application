import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {TourSchedule} from '../domain/model/tour-schedule.entity';
import {TourSchedulesResponse, TourScheduleResource} from './tour-schedules-response';

/**
 * Maps tour-schedule entities to and from API resources.
 */
export class TourScheduleAssembler implements BaseAssembler<TourSchedule, TourScheduleResource, TourSchedulesResponse> {

  /**
   * Converts a TourSchedulesResponse to an array of TourSchedule entities.
   * @param response - The API response containing tour-schedules.
   * @returns An array of TourSchedule entities.
   */
  toEntitiesFromResponse = (response: TourSchedulesResponse): TourSchedule[] =>
    response.tourSchedules.map(resource => this.toEntityFromResource(resource as TourScheduleResource));

  /**
   * Converts a TourScheduleResource to a TourSchedule entity.
   * @param resource - The resource to convert.
   * @returns The converted TourSchedule entity.
   */
  toEntityFromResource = (resource: TourScheduleResource): TourSchedule =>
    new TourSchedule({
      id: resource.id,
      tourId: resource.tourId,
      departureDatetime: resource.departureDatetime,
      maxCapacity: resource.maxCapacity,
      status: resource.status
    });

  /**
   * Converts a TourSchedule entity to a TourScheduleResource.
   * @param entity - The entity to convert.
   * @returns The converted TourScheduleResource.
   */
  toResourceFromEntity = (entity: TourSchedule): TourScheduleResource =>
    ({
      id: entity.id,
      tourId: entity.tourId,
      departureDatetime: entity.departureDatetime,
      maxCapacity: entity.maxCapacity,
      status: entity.status
    } as TourScheduleResource);


}
