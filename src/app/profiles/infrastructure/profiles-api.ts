import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Profile } from '../domain/model/profile.entity';
import { ProfilesApiEndpoint } from './profiles-api-endpoint';

@Injectable({ providedIn: 'root' })
export class ProfilesApi extends BaseApi {
  #endpoint = new ProfilesApiEndpoint(inject(HttpClient));

  getProfiles = (): Observable<Profile[]> => this.#endpoint.getAll();
}
