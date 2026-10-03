import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a participant.
 */
export interface ParticipantResource extends BaseResource {
  /**
   * Unique identifier for the participant.
   */
  id: number;
  /**
   * UserId of the participant.
   */
  userId: number;
  /**
   * JoinedAt of the participant.
   */
  joinedAt: string;

  /**
   * Identifier for the tourSchedule this participant belongs to.
   */
  tourScheduleId: number;
}

/**
 * Response envelope for participant collection queries.
 */
export interface ParticipantsResponse extends BaseResponse {
  /**
   * An Array for participant resources included in the response.
   */
  participants: ParticipantResource[];
}
