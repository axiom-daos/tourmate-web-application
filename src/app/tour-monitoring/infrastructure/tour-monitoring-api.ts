import {inject, Injectable} from '@angular/core';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {ActiveTour} from '../domain/model/active-tour.entity';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ActiveToursApiEndpoint} from './active-tours-api-endpoint';
import {TourGuidesApiEndpoint} from './tour-guides-api-endpoint';
import {TourGuide} from '../domain/model/tour-guide.entity';
import {TourSchedule} from '../domain/model/tour-schedule.entity';
import {TourSchedulesApiEndpoint} from './tour-schedules-api-endpoint';
import {ParticipantsApiEndpoint} from './participants-api-endpoint';
import {Participant} from '../domain/model/participant.entity';

/**
 * Infrastructure facade for active tours endpoint operations.
 */
@Injectable({providedIn: 'root'})
export class TourMonitoringApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly activeToursEndpoint = new ActiveToursApiEndpoint(this.http);
  private readonly tourGuidesEndpoint = new TourGuidesApiEndpoint(this.http);
  private readonly tourSchedulesEndpoint = new TourSchedulesApiEndpoint(this.http);
  private readonly participantsEndpoint = new ParticipantsApiEndpoint(this.http);

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
   * @param activeTour - The active tour to create.
   * @returns An Observable of the created ActiveTour object.
   */
  createActiveTour = (activeTour: ActiveTour): Observable<ActiveTour> =>
    this.activeToursEndpoint.create(activeTour);

  /**
   * Updates an existing active tour.
   * @param activeTour - The active tour to update.
   * @returns An Observable of the updated ActiveTour object.
   */
  updateActiveTour = (activeTour: ActiveTour): Observable<ActiveTour> =>
    this.activeToursEndpoint.update(activeTour, activeTour.id);

  /**
   * Deletes an active tour by ID.
   * @param id - The ID of the active tour to delete.
   * @returns An Observable of void.
   */
  deleteActiveTour = (id: number): Observable<void> =>
    this.activeToursEndpoint.delete(id);





  /**
   * Retrieves all tourGuides.
   * @returns Stream with the tourGuide collection.
   */
  getTourGuides = (): Observable<TourGuide[]> =>
    this.tourGuidesEndpoint.getAll();

  /**
   * Retrieves a single tourGuide by ID.
   * @param id - The ID of the tourGuide.
   * @returns An Observable of the TourGuide object.
   */
  getTourGuide = (id: number): Observable<TourGuide> =>
    this.tourGuidesEndpoint.getById(id);

  /**
   * Creates a new tourGuide.
   * @param tourGuide - The tourGuide to create.
   * @returns An Observable of the created TourGuide object.
   */
  createTourGuide = (tourGuide: TourGuide): Observable<TourGuide> =>
    this.tourGuidesEndpoint.create(tourGuide);

  /**
   * Updates an existing tourGuide.
   * @param tourGuide - The tourGuide to update.
   * @returns An Observable of the updated TourGuide object.
   */
  updateTourGuide = (tourGuide: TourGuide): Observable<TourGuide> =>
    this.tourGuidesEndpoint.update(tourGuide, tourGuide.id);

  /**
   * Deletes a tourGuide by ID.
   * @param id - The ID of the tourGuide to delete.
   * @returns An Observable of void.
   */
  deleteTourGuide = (id: number): Observable<void> =>
    this.tourGuidesEndpoint.delete(id);



  /**
   * Retrieves all tourSchedules.
   * @returns Stream with the tourSchedule collection.
   */
  getTourSchedules = (): Observable<TourSchedule[]> =>
    this.tourSchedulesEndpoint.getAll();

  /**
   * Retrieves a single tourSchedule by ID.
   * @param id - The ID of the tourSchedule.
   * @returns An Observable of the TourSchedule object.
   */
  getTourSchedule = (id: number): Observable<TourSchedule> =>
    this.tourSchedulesEndpoint.getById(id);

  /**
   * Creates a new tourSchedule.
   * @param tourSchedule - The tourSchedule to create.
   * @returns An Observable of the created TourSchedule object.
   */
  createTourSchedule = (tourSchedule: TourSchedule): Observable<TourSchedule> =>
    this.tourSchedulesEndpoint.create(tourSchedule);

  /**
   * Updates an existing tourSchedule.
   * @param tourSchedule - The tourSchedule to update.
   * @returns An Observable of the updated TourSchedule object.
   */
  updateTourSchedule = (tourSchedule: TourSchedule): Observable<TourSchedule> =>
    this.tourSchedulesEndpoint.update(tourSchedule, tourSchedule.id);

  /**
   * Deletes a tourSchedule by ID.
   * @param id - The ID of the tourSchedule to delete.
   * @returns An Observable of void.
   */
  deleteTourSchedule = (id: number): Observable<void> =>
    this.tourSchedulesEndpoint.delete(id);

  /**
   * Retrieves all participants.
   * @returns Stream with the participant collection.
   */
  getParticipants = (): Observable<Participant[]> =>
    this.participantsEndpoint.getAll();

  /**
   * Retrieves a single participant by ID.
   * @param id - The ID of the participant.
   * @returns An Observable of the Participant object.
   */
  getParticipant = (id: number): Observable<Participant> =>
    this.participantsEndpoint.getById(id);

  /**
   * Creates a new participant.
   * @param participant - The participant to create.
   * @returns An Observable of the created Participant object.
   */
  createParticipant = (participant: Participant): Observable<Participant> =>
    this.participantsEndpoint.create(participant);

  /**
   * Updates an existing participant.
   * @param participant - The participant to update.
   * @returns An Observable of the updated Participant object.
   */
  updateParticipant = (participant: Participant): Observable<Participant> =>
    this.participantsEndpoint.update(participant, participant.id);

  /**
   * Deletes a participant by ID.
   * @param id - The ID of the participant to delete.
   * @returns An Observable of void.
   */
  deleteParticipant = (id: number): Observable<void> =>
    this.participantsEndpoint.delete(id);
}
