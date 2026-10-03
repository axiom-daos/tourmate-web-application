import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { IncidentStatus } from '../value-object/incident-status';

/**
 * Represents an Incident aggregate in the safety and incident management domain model.
 */
export class Incident implements BaseEntity {
  #id: number;
  #uuid: string;
  #activeTourId: number;
  #reportedByUserId: number;
  #description: string;
  #latitude: number;
  #longitude: number;
  #reportedAt: string;
  #status: IncidentStatus;

  constructor(incident: {
    id: number;
    uuid?: string;
    activeTourId: number;
    reportedByUserId: number;
    description: string;
    latitude: number;
    longitude: number;
    reportedAt: string;
    status: IncidentStatus | string;
  }) {
    this.#id = incident.id;
    this.#uuid = incident.uuid ?? '';
    this.#activeTourId = incident.activeTourId;
    this.#reportedByUserId = incident.reportedByUserId;
    this.#description = incident.description;
    this.#latitude = incident.latitude;
    this.#longitude = incident.longitude;
    this.#reportedAt = incident.reportedAt;
    this.#status =
      typeof incident.status === 'string'
        ? (IncidentStatus[incident.status as keyof typeof IncidentStatus] ??
          IncidentStatus.OPEN)
        : incident.status;
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get uuid(): string {
    return this.#uuid;
  }

  set uuid(value: string) {
    this.#uuid = value;
  }

  get activeTourId(): number {
    return this.#activeTourId;
  }

  set activeTourId(value: number) {
    this.#activeTourId = value;
  }

  get reportedByUserId(): number {
    return this.#reportedByUserId;
  }

  set reportedByUserId(value: number) {
    this.#reportedByUserId = value;
  }

  get description(): string {
    return this.#description;
  }

  set description(value: string) {
    this.#description = value;
  }

  get latitude(): number {
    return this.#latitude;
  }

  set latitude(value: number) {
    this.#latitude = value;
  }

  get longitude(): number {
    return this.#longitude;
  }

  set longitude(value: number) {
    this.#longitude = value;
  }

  get reportedAt(): string {
    return this.#reportedAt;
  }

  set reportedAt(value: string) {
    this.#reportedAt = value;
  }

  get status(): IncidentStatus {
    return this.#status;
  }

  set status(value: IncidentStatus) {
    this.#status = value;
  }

  /**
   * Domain behavior to resolve the incident.
   */
  resolve(): void {
    this.#status = IncidentStatus.RESOLVED;
  }
}
