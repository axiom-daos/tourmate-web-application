import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { User } from '../domain/model/user.entity';
import { UserRole } from '../domain/model/value-object/user-role';
import { UsersApiEndpoint } from './users-api-endpoint';

describe('UsersApiEndpoint', () => {
  let endpoint: UsersApiEndpoint;
  let httpTesting: HttpTestingController;
  const usersUrl = `${environment.usersApiBaseUrl}${environment.tourmateProviderUsersEndpointPath}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    endpoint = new UsersApiEndpoint(TestBed.inject(HttpClient));
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('maps user responses without logging or exposing password hashes', () => {
    const log = vi.spyOn(console, 'log');
    let users: User[] = [];

    endpoint.getAll().subscribe((result) => (users = result));
    httpTesting.expectOne(usersUrl).flush([
      {
        id: 5,
        email: 'guide@example.com',
        role: UserRole.GUIDE,
        firstName: 'Ana',
        lastName: 'Ramos',
        passwordHash: 'server-managed-secret',
      },
    ]);

    expect(log).not.toHaveBeenCalled();
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('guide@example.com');
    expect('passwordHash' in users[0]).toBe(false);
    log.mockRestore();
  });

  it('patches profile changes without replacing server-managed credentials', () => {
    const user = new User({
      id: 5,
      email: 'new-email@example.com',
      role: UserRole.GUIDE,
      firstName: 'Ana',
      lastName: 'Ramos',
    });

    endpoint.update(user, user.id).subscribe();
    const request = httpTesting.expectOne(`${usersUrl}/${user.id}`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      id: 5,
      email: 'new-email@example.com',
      role: UserRole.GUIDE,
      firstName: 'Ana',
      lastName: 'Ramos',
    });
    expect('passwordHash' in request.request.body).toBe(false);
    request.flush({
      id: 5,
      email: 'new-email@example.com',
      role: UserRole.GUIDE,
      firstName: 'Ana',
      lastName: 'Ramos',
    });
  });
});
