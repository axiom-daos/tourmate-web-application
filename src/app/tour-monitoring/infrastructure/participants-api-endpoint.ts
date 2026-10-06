import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {Participant} from '../domain/model/participant.entity';
import {ParticipantResource, ParticipantsResponse} from './participants-response';
import {ParticipantAssembler} from './participant-assembler';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';


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
}
