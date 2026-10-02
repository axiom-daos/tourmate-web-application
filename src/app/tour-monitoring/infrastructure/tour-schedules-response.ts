import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a tourSchedule.
 */
export interface TourScheduleResource extends BaseResource {
  /**
   * The unique identifier for the tourSchedule.
   */
  id: number;

  /**
   * The tour identifier for the tourSchedule.
   */
  tourId: number;
  departureDatetime: string;
  maxCapacity: number;
  status: string;
}

/**
 * Response envelope for tourSchedule collection queries.
 */
export interface TourSchedulesResponse extends BaseResponse {
  /**
   * The list of tourSchedules returned by the API.
   */
  tourSchedules: TourScheduleResource[];
}
