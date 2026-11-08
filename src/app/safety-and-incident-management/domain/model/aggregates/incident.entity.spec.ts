import { Incident, IncidentSeverity } from './incident.entity';
import { IncidentStatus } from '../value-object/incident-status';

describe('Incident Domain Entity - Business Logic & Emergency Protocols', () => {

  it('should create an incident instance with default values and offline flag', () => {
    const incident = new Incident({
      id: 1,
      activeTourId: 100,
      reportedByUserId: 5,
      description: 'Test incident in remote trail',
      latitude: -12.0464,
      longitude: -77.0428,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      severity: 'MEDIUM',
      isSynced: false
    });

    expect(incident).toBeTruthy();
    expect(incident.isSynced).toBeFalsy();
    expect(incident.severity).toEqual('MEDIUM');
  });

  it('should return CRITICAL guided emergency protocols for mountain expeditions', () => {
    const criticalIncident = new Incident({
      id: 2,
      activeTourId: 100,
      reportedByUserId: 5,
      description: 'Severe altitude sickness and breathing difficulty',
      latitude: -13.1631,
      longitude: -72.5450,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      severity: 'CRITICAL'
    });

    const protocols = criticalIncident.getGuidedProtocols();

    expect(protocols.length).toBeGreaterThan(0);
    expect(protocols[0]).toContain('evacuación médica inmediata');
  });

  it('should successfully resolve the incident using domain behavior', () => {
    const incident = new Incident({
      id: 3,
      activeTourId: 100,
      reportedByUserId: 5,
      description: 'Minor dehydration case',
      latitude: -12.0,
      longitude: -77.0,
      reportedAt: new Date().toISOString(),
      status: IncidentStatus.OPEN,
      severity: 'LOW'
    });

    expect(incident.status).toEqual(IncidentStatus.OPEN);

    incident.resolve('Participant received first aid.');

    expect(incident.status).toEqual(IncidentStatus.RESOLVED);
    expect(incident.resolutionNote).toEqual('Participant received first aid.');
  });

});
