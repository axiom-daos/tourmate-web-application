import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {TourSchedule} from '../domain/model/tour-schedule.entity';
import {TourScheduleResource, TourSchedulesResponse} from './tour-schedule-response';
import {TourScheduleAssembler} from './tour-schedule-assembler';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import { Observable } from "rxjs";
import {environment} from '../../../environments/environment';

export class TourScheduleApiEndpoint extends BaseApiEndpoint<TourSchedule, TourScheduleResource, TourSchedulesResponse, TourScheduleAssembler> {

    constructor(http: HttpClient) {
      super(http,environment.tourmateProviderApiBaseUrl + environment.tourmateProviderTourSchedulesEndpointPath, new TourScheduleAssembler());
    }

}
