import {TourSchedule} from './tour-schedule.entity';

/**
 * Represents a participant aggregate in the learning domain model.
 */
export class Participant {
  /**
   * Unique identifier for the participant.
   */
  #id: number;

  /**
   * UserId of the participant.
   */
  #userId: number;

  /**
   * JoinedAt of the participant.
   */
  #joinedAt: string;

  /**
   * Identifier of the tourSchedule associated with the participant.
   */
  #tourScheduleId: number;

  /**
   * The tourSchedule object associated with the participant, or null if not set.
   */
  #tourSchedule: TourSchedule | null;

  /**
   * Creates a new instance of the Participant class.
   *
   * @param participant - An object containing optional properties to initialize the participant.
   * @param participant.id - The unique identifier for the participant.
   * @param participant.userId - The userId of the participant.
   * @param participant.joinedAt - The joinedAt of the participant.
   * @param participant.tourScheduleId - The identifier of the tourSchedule associated with the participant.
   */
  constructor(participant: { id: number; userId: number; joinedAt: string; tourScheduleId: number; tourSchedule?: TourSchedule | null }) {
    this.#id = participant.id;
    this.#userId = participant.userId;
    this.#joinedAt = participant.joinedAt;
    this.#tourScheduleId = participant.tourScheduleId;
    this.#tourSchedule = participant.tourSchedule ?? null;
  }

  /**
   * The tourSchedule associated with the participant.
   * @remarks
   * This is an object reference to the {@link TourSchedule} entity. It may be null if not set.
   */
  get tourSchedule(): TourSchedule | null {
    return this.#tourSchedule;
  }

  /**
   * Sets the tourSchedule associated with the participant.
   *
   * @param value - The {@link TourSchedule} to associate with the participant.
   */
  set tourSchedule(value: TourSchedule | null) {
    this.#tourSchedule = value;
  }

  /**
   * Gets the participant id.
   * @returns The unique identifier for the participant.
   */
  get id(): number {
    return this.#id;
  }

  /**
   * Sets the participant id.
   * @param value - The unique identifier to set for the participant.
   */
  set id(value: number) {
    this.#id = value;
  }

  /**
   * Gets the participant userId.
   * @returns The userId of the participant.
   */
  get userId(): number {
    return this.#userId;
  }

  /**
   * Sets the participant userId.
   * @param value - The userId to set for the participant.
   */
  set userId(value: number) {
    this.#userId = value;
  }

  /**
   * Gets the participant joinedAt.
   * @returns The joinedAt of the participant.
   */
  get joinedAt(): string {
    return this.#joinedAt;
  }

  /**
   * Sets the participant joinedAt.
   * @param value - The joinedAt to set for the participant.
   */
  set joinedAt(value: string) {
    this.#joinedAt = value;
  }

  /**
   * Gets the tourSchedule id associated with the participant.
   * @returns The identifier of the tourSchedule.
   */
  get tourScheduleId(): number {
    return this.#tourScheduleId;
  }

  /**
   * Sets the tourSchedule id associated with the participant.
   * @param value - The identifier of the tourSchedule to associate with the participant.
   */
  set tourScheduleId(value: number) {
    this.#tourScheduleId = value;
  }
}
