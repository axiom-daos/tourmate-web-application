import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface TourScheduleResource extends BaseResource {

  "id": number,
  "tourId": number,
  "departureDatetime": string,
  "maxCapacity": number,
  "status": string
}


export interface TourSchedulesResponse extends BaseResponse {

  tour_schedules: TourScheduleResource[]
}
