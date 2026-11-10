import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Profile } from '../domain/model/profile.entity';
import { ProfileAssembler } from './profile-assembler';
import { ProfileResource, ProfilesResponse } from './profile-response';

export class ProfilesApiEndpoint extends BaseApiEndpoint<
  Profile,
  ProfileResource,
  ProfilesResponse,
  ProfileAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.usersApiBaseUrl}${environment.tourmateProviderUsersEndpointPath}`,
      new ProfileAssembler(),
    );
  }

  override getAll(): Observable<Profile[]> {
    return this.http.get<ProfilesResponse | ProfileResource[]>(this.endpointUrl).pipe(
      map((response) =>
        Array.isArray(response)
          ? response.map((resource) => this.assembler.toEntityFromResource(resource))
          : this.assembler.toEntitiesFromResponse(response),
      ),
      catchError(this.handleError('Failed to fetch profiles')),
    );
  }

}
