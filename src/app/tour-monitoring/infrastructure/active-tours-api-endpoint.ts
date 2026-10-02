import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {ActiveTour} from '../domain/model/active-tour.entity';
import {ActiveTourResource, ActiveToursResponse} from './active-tours-response';
import {ActiveTourAssembler} from './active-tour-assembler';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';


/**
 * Endpoint client for course CRUD operations.
 */
export class ActiveToursApiEndpoint extends BaseApiEndpoint<ActiveTour, ActiveTourResource, ActiveToursResponse, ActiveTourAssembler> {
  /**
   * Creates an instance of ActiveToursApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(http, `${environment.tourmateProviderApiBaseUrl}${environment.tourmateProviderActiveToursEndpointPath}`, new ActiveTourAssembler());
  }
}
