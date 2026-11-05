import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { IncidentStatus } from '../value-object/incident-status';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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
  #severity: IncidentSeverity;
  #isSynced: boolean;

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
    severity?: IncidentSeverity | string;
    isSynced?: boolean;
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
        ? (IncidentStatus[incident.status as keyof typeof IncidentStatus] ?? IncidentStatus.OPEN)
        : incident.status;
    this.#severity =
      typeof incident.severity === 'string' &&
      (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as readonly string[]).includes(incident.severity)
        ? (incident.severity as IncidentSeverity)
        : 'MEDIUM';
    this.#isSynced = incident.isSynced ?? true;
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

  get severity(): IncidentSeverity {
    return this.#severity;
  }
  set severity(value: IncidentSeverity) {
    this.#severity = value;
  }

  get isSynced(): boolean {
    return this.#isSynced;
  }
  set isSynced(value: boolean) {
    this.#isSynced = value;
  }

  resolve(): void {
    this.#status = IncidentStatus.RESOLVED;
  }

  getGuidedProtocols(): string[] {
    switch (this.#severity) {
      case 'CRITICAL':
        return [
          '1. Iniciar protocolo de evacuación médica inmediata.',
          '2. Establecer enlace satelital o radio VHF con la base de operaciones.',
          '3. Administrar oxígeno suplementario y monitorear signos vitales por 15 min.',
        ];
      case 'HIGH':
        return [
          '1. Detener la marcha de la expedición activa.',
          '2. Evaluar hidratación y aplicar primeros auxilios tácticos.',
          '3. Reportar ubicación exacta al guía principal y preparar kit de rescate.',
        ];
      default:
        return [
          '1. Registrar observación en bitácora de ruta.',
          '2. Monitorear evolución del participante en el próximo Checkpoint Bluetooth.',
        ];
    }
  }
}
