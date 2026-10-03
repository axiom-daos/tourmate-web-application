import {ParticipantResource, ParticipantsResponse} from './participants-response';
import {Participant} from '../domain/model/participant.entity';
import {BaseAssembler} from '../../shared/infrastructure/base-assembler';

/**
 * Maps participant entities to and from API resources.
 */
export class ParticipantAssembler implements BaseAssembler<Participant, ParticipantResource, ParticipantsResponse> {
  /**
   * Converts a ParticipantsResponse to an array of Participant entities.
   * @param response - The API response containing participants.
   * @returns An array of Participant entities.
   */
  toEntitiesFromResponse = (response: ParticipantsResponse): Participant[] => {
    console.log(response);
    return response.participants.map(resource => this.toEntityFromResource(resource as ParticipantResource));
  };

  /**
   * Converts a ParticipantResource to a Participant entity.
   * @param resource - The resource to convert.
   * @returns The converted Participant entity.
   */
  toEntityFromResource = (resource: ParticipantResource): Participant =>
    new Participant({
      id: resource.id,
      userId: resource.userId,
      joinedAt: resource.joinedAt,
      tourScheduleId: resource.tourScheduleId
    });


  /**
   * Converts a Participant entity to a ParticipantResource.
   * @param entity - The entity to convert.
   * @returns The converted ParticipantResource.
   */
  toResourceFromEntity = (entity: Participant): ParticipantResource =>
    ({
      id: entity.id,
      userId: entity.userId,
      joinedAt: entity.joinedAt,
      tourScheduleId: entity.tourScheduleId
    } as ParticipantResource);

}
