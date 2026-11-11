import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { Profile } from '../domain/model/profile.entity';
import { ProfileRole } from '../domain/model/profile-role';
import { ProfilesApiEndpoint } from './profiles-api-endpoint';

describe('ProfilesApiEndpoint', () => {
  let endpoint: ProfilesApiEndpoint;
  let httpTesting: HttpTestingController;
  const profilesUrl = `${environment.tourmateProviderApiBaseUrl}${environment.tourmateProviderUsersEndpointPath}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    endpoint = new ProfilesApiEndpoint(TestBed.inject(HttpClient));
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.restoreAllMocks();
  });

  it('maps profile collections without logging user data', () => {
    const log = vi.spyOn(console, 'log');
    let profiles: Profile[] = [];

    endpoint.getAll().subscribe((result) => (profiles = result));
    httpTesting.expectOne(profilesUrl).flush([
      {
        id: 8,
        firstName: 'Lucia',
        lastName: 'Quispe',
        email: 'lucia@example.com',
        role: 'AGENCY_OWNER',
        passwordHash: 'server-managed-secret',
      },
    ]);

    expect(log).not.toHaveBeenCalled();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].role).toBe(ProfileRole.AGENCY);
    expect('passwordHash' in profiles[0]).toBe(false);
    log.mockRestore();
  });

});
