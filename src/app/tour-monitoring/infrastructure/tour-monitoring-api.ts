import {inject, Injectable} from '@angular/core';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {ActiveTour} from '../domain/model/active-tour.entity';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ActiveToursApiEndpoint} from './active-tours-api-endpoint';

/**
 * Infrastructure facade for active tours endpoint operations.
 */
@Injectable({providedIn: 'root'})
export class TourMonitoringApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly activeToursEndpoint = new ActiveToursApiEndpoint(this.http);


  /**
   * Retrieves all active tours.
   * @returns Stream with the active tour collection.
   */
  getActiveTours = (): Observable<ActiveTour[]> =>
    this.activeToursEndpoint.getAll();

  /**
   * Retrieves a single active tour by ID.
   * @param id - The ID of the active tour.
   * @returns An Observable of the ActiveTour object.
   */
  getActiveTour = (id: number): Observable<ActiveTour> =>
    this.activeToursEndpoint.getById(id);

  /**
   * Creates a new active tour.
   * @param course - The active tour to create.
   * @returns An Observable of the created ActiveTour object.
   */
  createActiveTour = (course: ActiveTour): Observable<ActiveTour> =>
    this.activeToursEndpoint.create(course);

  /**
   * Updates an existing active tour.
   * @param course - The active tour to update.
   * @returns An Observable of the updated ActiveTour object.
   */
  updateActiveTour = (course: ActiveTour): Observable<ActiveTour> =>
    this.activeToursEndpoint.update(course, course.id);

  /**
   * Deletes an active tour by ID.
   * @param id - The ID of the active tour to delete.
   * @returns An Observable of void.
   */
  deleteActiveTour = (id: number): Observable<void> =>
    this.activeToursEndpoint.delete(id);


}
