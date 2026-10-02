import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {Tour} from '../domain/model/tour.entity';
import {TourResource, ToursResponse} from './tour-response';
import {TourAssembler} from './tour-assembler';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment.development';

export class ToursApiEndpoint extends BaseApiEndpoint<Tour, TourResource, ToursResponse, TourAssembler>{

  constructor(http: HttpClient) {
    super
    (http,
      `${environment.tourmateProviderApiBaseUrl +
    environment.tourmateProviderTourManagementEndpointPath +
    environment.tourmateProviderToursEndpointPath}`
      , new TourAssembler());
  }

}
