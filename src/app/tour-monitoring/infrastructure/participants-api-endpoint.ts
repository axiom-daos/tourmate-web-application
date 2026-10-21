import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {Participant} from '../domain/model/participant.entity';
import {ParticipantResource, ParticipantsResponse} from './participants-response';
import {ParticipantAssembler} from './participant-assembler';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {catchError, map} from 'rxjs';
import {Observable} from 'rxjs';


/**
 * Endpoint client for participant CRUD operations.
 */
export class ParticipantsApiEndpoint extends BaseApiEndpoint<Participant, ParticipantResource, ParticipantsResponse, ParticipantAssembler> {
  /**
   * Creates an instance of ParticipantsApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(http, `${environment.participantsApiBaseUrl}${environment.tourmateProviderParticipantsEndpointPath}`, new ParticipantAssembler());
  }

  override create(participant: Participant): Observable<Participant> {
    const {id: _id, ...resource} = this.assembler.toResourceFromEntity(participant);
    return this.http.post<ParticipantResource>(this.endpointUrl, resource).pipe(
      map(created => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create participant')),
    );
  }
}
