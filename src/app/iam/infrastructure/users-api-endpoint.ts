import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { User } from '../domain/model/user.entity';
import { UserAssembler } from './user-assembler';
import { UserResource, UsersResponse } from './user-response';

export class UsersApiEndpoint extends BaseApiEndpoint<
  User,
  UserResource,
  UsersResponse,
  UserAssembler
> {
  constructor(http: HttpClient) {
    const url = `${environment.tourmateProviderApiBaseUrl}${environment.tourmateProviderUsersEndpointPath}`;
    super(http, url, new UserAssembler());
  }

  override getAll(): Observable<User[]> {
    return this.http.get<UsersResponse | UserResource[]>(this.endpointUrl).pipe(
      map((response) =>
        Array.isArray(response)
          ? response.map((resource) => this.assembler.toEntityFromResource(resource))
          : this.assembler.toEntitiesFromResponse(response),
      ),
      catchError(this.handleError('Failed to fetch users')),
    );
  }

  override update(entity: User, id: number): Observable<User> {
    const resource = this.assembler.toResourceFromEntity(entity);
    return this.http.patch<UserResource>(`${this.endpointUrl}/${id}`, resource).pipe(
      map((updated) => this.assembler.toEntityFromResource(updated)),
      catchError(this.handleError('Failed to update user')),
    );
  }
}
