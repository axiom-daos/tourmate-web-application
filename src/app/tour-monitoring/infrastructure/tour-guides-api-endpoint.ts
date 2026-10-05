import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {TourGuide} from '../domain/model/tour-guide.entity';
import {TourGuideResource, TourGuidesResponse} from './tour-guides-response';
import {TourGuideAssembler} from './tour-guide-assembler';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';


/**
 * Endpoint client for course CRUD operations.
 */
export class TourGuidesApiEndpoint extends BaseApiEndpoint<TourGuide, TourGuideResource, TourGuidesResponse, TourGuideAssembler> {
  /**
   * Creates an instance of TourGuidesApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(http, `${environment.tourmateProviderApiBaseUrl}${environment.tourmateProviderTourGuidesEndpointPath}`, new TourGuideAssembler());
  }
}
