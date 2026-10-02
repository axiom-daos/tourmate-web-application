import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {TourSchedule} from '../domain/model/tour-schedule.entity';
import {TourScheduleResource, TourSchedulesResponse} from './tour-schedules-response';
import {TourScheduleAssembler} from './tour-schedule-assembler';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';


/**
 * Endpoint client for course CRUD operations.
 */
export class TourSchedulesApiEndpoint extends BaseApiEndpoint<TourSchedule, TourScheduleResource, TourSchedulesResponse, TourScheduleAssembler> {
  /**
   * Creates an instance of TourSchedulesApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(http, `${environment.tourmateProviderApiBaseUrl}${environment.tourmateProviderTourSchedulesEndpointPath}`, new TourScheduleAssembler());
  }
}
