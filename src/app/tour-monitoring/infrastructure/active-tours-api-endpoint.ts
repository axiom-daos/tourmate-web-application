import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {ActiveTour} from '../domain/model/active-tour.entity';
import {ActiveTourResource, ActiveToursResponse} from './active-tours-response';
import {ActiveTourAssembler} from './active-tour-assembler';
import {HttpClient} from '@angular/common/http';
import {catchError, map} from 'rxjs';
import {Observable} from 'rxjs';
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
    super(http, `${environment.activeToursApiBaseUrl}${environment.tourmateProviderActiveToursEndpointPath}`, new ActiveTourAssembler());
  }

  override create(activeTour: ActiveTour): Observable<ActiveTour> {
    const {id: _id, ...resource} = this.assembler.toResourceFromEntity(activeTour);
    return this.http.post<ActiveTourResource>(this.endpointUrl, resource).pipe(
      map(created => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create active tour')),
    );
  }
}
