import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Agency } from '../domain/model/agency.entity';
import { TourGuide } from '../domain/model/tour-guide.entity';
import { User } from '../domain/model/user.entity';
import { AgenciesApiEndpoint } from './agencies-api-endpoint';
import { TourGuidesApiEndpoint } from './tour-guides-api-endpoint';
import { UsersApiEndpoint } from './users-api-endpoint';

@Injectable({ providedIn: 'root' })
export class IamApi extends BaseApi {
  #http = inject(HttpClient);
  #usersEndpoint = new UsersApiEndpoint(this.#http);
  #agenciesEndpoint = new AgenciesApiEndpoint(this.#http);
  #tourGuidesEndpoint = new TourGuidesApiEndpoint(this.#http);

  getUsers = (): Observable<User[]> => this.#usersEndpoint.getAll();

  getUser = (id: number): Observable<User> => this.#usersEndpoint.getById(id);

  createUser = (user: User): Observable<User> => this.#usersEndpoint.create(user);

  updateUser = (user: User): Observable<User> => this.#usersEndpoint.update(user, user.id);

  deleteUser = (id: number): Observable<void> => this.#usersEndpoint.delete(id);

  getAgencies = (): Observable<Agency[]> => this.#agenciesEndpoint.getAll();

  getAgency = (id: number): Observable<Agency> => this.#agenciesEndpoint.getById(id);

  createAgency = (agency: Agency): Observable<Agency> => this.#agenciesEndpoint.create(agency);

  updateAgency = (agency: Agency): Observable<Agency> =>
    this.#agenciesEndpoint.update(agency, agency.id);

  deleteAgency = (id: number): Observable<void> => this.#agenciesEndpoint.delete(id);

  getTourGuides = (): Observable<TourGuide[]> => this.#tourGuidesEndpoint.getAll();

  getTourGuide = (id: number): Observable<TourGuide> => this.#tourGuidesEndpoint.getById(id);

  createTourGuide = (tourGuide: TourGuide): Observable<TourGuide> =>
    this.#tourGuidesEndpoint.create(tourGuide);

  updateTourGuide = (tourGuide: TourGuide): Observable<TourGuide> =>
    this.#tourGuidesEndpoint.update(tourGuide, tourGuide.id);

  deleteTourGuide = (id: number): Observable<void> => this.#tourGuidesEndpoint.delete(id);
}
