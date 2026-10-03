import {inject, Service} from '@angular/core';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {HttpClient} from '@angular/common/http';
import {ToursApiEndpoint} from './tours-api-endpoint';
import {Observable, tap} from 'rxjs';
import {Tour} from '../domain/model/tour.entity';

@Service()
export class TourManagementApi extends BaseApi {

  #http: HttpClient = inject(HttpClient)
  #toursEndpoint: ToursApiEndpoint = new ToursApiEndpoint(this.#http)

  getTours = (): Observable<Tour[]> => this.#toursEndpoint.getAll()

  getTour = (id: number): Observable<Tour> => this.#toursEndpoint.getById(id)

  createTour = (tour: Tour): Observable<Tour> => this.#toursEndpoint.create(tour)

  updateTour = (tour: Tour): Observable<Tour> => this.#toursEndpoint.update(tour, tour.id)

  deleteTour = (id: number): Observable<void> => this.#toursEndpoint.delete(id)
}
