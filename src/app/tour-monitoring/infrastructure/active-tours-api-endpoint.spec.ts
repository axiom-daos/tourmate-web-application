import {HttpClient, provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {environment} from '../../../environments/environment';
import {ActiveTour} from '../domain/model/active-tour.entity';
import {ActiveToursApiEndpoint} from './active-tours-api-endpoint';

describe('ActiveToursApiEndpoint CRUD', () => {
  let endpoint: ActiveToursApiEndpoint;
  let httpTesting: HttpTestingController;
  const url = `${environment.activeToursApiBaseUrl}${environment.tourmateProviderActiveToursEndpointPath}`;
  const resource = {
    id: 21,
    tourScheduleId: 4,
    guideId: 3,
    status: 'IN_PROGRESS',
    currentLatitude: -13.16,
    currentLongitude: -72.52,
    startedAt: '2026-10-06T08:00:00.000Z',
    finishedAt: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    endpoint = new ActiveToursApiEndpoint(TestBed.inject(HttpClient));
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('reads active tours and maps the resource', () => {
    let result: ActiveTour[] = [];
    endpoint.getAll().subscribe(tours => result = tours);
    httpTesting.expectOne(url).flush([resource]);

    expect(result).toHaveLength(1);
    expect(result[0].tourScheduleId).toBe(4);
    expect(result[0].guideId).toBe(3);
  });

  it('creates without sending the temporary ID and returns the generated entity', () => {
    const activeTour = new ActiveTour({...resource, id: 0});
    let created: ActiveTour | undefined;
    endpoint.create(activeTour).subscribe(value => created = value);
    const request = httpTesting.expectOne(url);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).not.toHaveProperty('id');
    request.flush(resource);
    expect(created?.id).toBe(21);
  });

  it('updates the requested active tour', () => {
    const activeTour = new ActiveTour(resource);
    endpoint.update(activeTour, activeTour.id).subscribe();
    const request = httpTesting.expectOne(`${url}/21`);

    expect(request.request.method).toBe('PUT');
    expect(request.request.body.tourScheduleId).toBe(4);
    request.flush(resource);
  });

  it('deletes the requested active tour', () => {
    endpoint.delete(21).subscribe();
    const request = httpTesting.expectOne(`${url}/21`);

    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
