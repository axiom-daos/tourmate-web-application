import {HttpClient, provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {environment} from '../../../environments/environment';
import {Participant} from '../domain/model/participant.entity';
import {ParticipantsApiEndpoint} from './participants-api-endpoint';

describe('ParticipantsApiEndpoint CRUD', () => {
  let endpoint: ParticipantsApiEndpoint;
  let httpTesting: HttpTestingController;
  const url = `${environment.participantsApiBaseUrl}${environment.tourmateProviderParticipantsEndpointPath}`;
  const resource = {
    id: 17,
    userId: 9,
    joinedAt: '2026-10-06T08:00:00.000Z',
    tourScheduleId: 4,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    endpoint = new ParticipantsApiEndpoint(TestBed.inject(HttpClient));
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('reads participants and maps the resource', () => {
    let result: Participant[] = [];
    endpoint.getAll().subscribe(participants => result = participants);
    httpTesting.expectOne(url).flush([resource]);

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(9);
    expect(result[0].tourScheduleId).toBe(4);
  });

  it('creates without sending the temporary ID and returns the generated entity', () => {
    const participant = new Participant({...resource, id: 0});
    let created: Participant | undefined;
    endpoint.create(participant).subscribe(value => created = value);
    const request = httpTesting.expectOne(url);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).not.toHaveProperty('id');
    request.flush(resource);
    expect(created?.id).toBe(17);
  });

  it('updates the requested participant', () => {
    const participant = new Participant(resource);
    endpoint.update(participant, participant.id).subscribe();
    const request = httpTesting.expectOne(`${url}/17`);

    expect(request.request.method).toBe('PUT');
    expect(request.request.body.tourScheduleId).toBe(4);
    request.flush(resource);
  });

  it('deletes the requested participant', () => {
    endpoint.delete(17).subscribe();
    const request = httpTesting.expectOne(`${url}/17`);

    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
