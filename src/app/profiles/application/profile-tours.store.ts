import { Injectable, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  defer,
  finalize,
  forkJoin,
  map,
  tap,
  throwError,
} from 'rxjs';
import { IamApi } from '../../iam/infrastructure/iam-api';
import { Tour } from '../../tour-management/domain/model/tour.entity';
import { TourSchedule } from '../../tour-management/domain/model/tour-schedule.entity';
import { TourManagementApi } from '../../tour-management/infrastructure/tour-management-api';
import { TourMonitoringApi } from '../../tour-monitoring/infrastructure/tour-monitoring-api';
import { Profile } from '../domain/model/profile.entity';
import { ProfileRole } from '../domain/model/profile-role';
import {
  AssignedTour,
  AssignedTourSchedule,
  TourAssignment,
  identifiersMatch,
} from './assigned-tour';

@Injectable({ providedIn: 'root' })
export class ProfileToursStore {
  #iamApi = inject(IamApi);
  #tourManagementApi = inject(TourManagementApi);
  #tourMonitoringApi = inject(TourMonitoringApi);
  #toursSignal = signal<AssignedTour[]>([]);
  #loadingSignal = signal(false);
  #errorSignal = signal<string | null>(null);

  readonly tours = this.#toursSignal.asReadonly();
  readonly loading = this.#loadingSignal.asReadonly();
  readonly error = this.#errorSignal.asReadonly();

  loadForProfile(profile: Profile): Observable<AssignedTour[]> {
    return defer(() => {
      this.#loadingSignal.set(true);
      this.#errorSignal.set(null);
      this.#toursSignal.set([]);

      return this.#loadAssignment(profile).pipe(
        tap((tours) => this.#toursSignal.set(tours)),
        catchError((error: unknown) => {
          this.#errorSignal.set(error instanceof Error ? error.message : 'Failed to load assigned tours');
          return throwError(() => error);
        }),
        finalize(() => this.#loadingSignal.set(false)),
      );
    });
  }

  #loadAssignment(profile: Profile): Observable<AssignedTour[]> {
    switch (profile.role) {
      case ProfileRole.ADMIN:
        return forkJoin({
          tours: this.#tourManagementApi.getTours(),
          schedules: this.#tourManagementApi.getTourSchedules(),
        }).pipe(
          map(({ tours, schedules }) =>
            this.#buildAssignments(tours, schedules, 'admin', () => true, () => true, new Map(), true),
          ),
        );

      case ProfileRole.AGENCY:
        return forkJoin({
          agencies: this.#iamApi.getAgencies(),
          tours: this.#tourManagementApi.getTours(),
          schedules: this.#tourManagementApi.getTourSchedules(),
        }).pipe(
          map(({ agencies, tours, schedules }) => {
            const agencyIds = new Set(
              agencies
                .filter((agency) => identifiersMatch(agency.ownerId, profile.userId))
                .map((agency) => Number(agency.id)),
            );
            return this.#buildAssignments(
              tours,
              schedules,
              'agency',
              (tour) => agencyIds.has(Number(tour.agencyId)),
              () => true,
              new Map(),
              true,
            );
          }),
        );

      case ProfileRole.GUIDE:
        return forkJoin({
          guides: this.#iamApi.getTourGuides(),
          activeTours: this.#tourMonitoringApi.getActiveTours(),
          tours: this.#tourManagementApi.getTours(),
          schedules: this.#tourManagementApi.getTourSchedules(),
        }).pipe(
          map(({ guides, activeTours, tours, schedules }) => {
            const guideIds = new Set(
              guides
                .filter((guide) => identifiersMatch(guide.userId, profile.userId))
                .map((guide) => Number(guide.id)),
            );
            const guideActiveTours = activeTours.filter((activeTour) =>
              guideIds.has(Number(activeTour.guideId)),
            );
            const activeBySchedule = new Map(
              guideActiveTours.map((activeTour) => [
                Number(activeTour.tourScheduleId),
                activeTour.status,
              ]),
            );
            const scheduleIds = new Set(activeBySchedule.keys());

            return this.#buildAssignments(
              tours,
              schedules,
              'guide',
              () => true,
              (schedule) => scheduleIds.has(Number(schedule.id)),
              activeBySchedule,
            );
          }),
        );

      case ProfileRole.TOURIST:
        return forkJoin({
          participants: this.#tourMonitoringApi.getParticipants(),
          tours: this.#tourManagementApi.getTours(),
          schedules: this.#tourManagementApi.getTourSchedules(),
        }).pipe(
          map(({ participants, tours, schedules }) => {
            const scheduleIds = new Set(
              participants
                .filter((participant) => identifiersMatch(participant.userId, profile.userId))
                .map((participant) => Number(participant.tourScheduleId)),
            );

            return this.#buildAssignments(
              tours,
              schedules,
              'tourist',
              () => true,
              (schedule) => scheduleIds.has(Number(schedule.id)),
            );
          }),
        );
    }
  }

  #buildAssignments(
    tours: Tour[],
    schedules: TourSchedule[],
    assignment: TourAssignment,
    matchesTour: (tour: Tour) => boolean,
    matchesSchedule: (schedule: TourSchedule) => boolean = () => true,
    activeBySchedule: ReadonlyMap<number, string> = new Map(),
    includeWithoutSchedules = false,
  ): AssignedTour[] {
    return tours
      .filter(matchesTour)
      .map((tour) => ({
        tour,
        schedules: schedules
          .filter(
            (schedule) =>
              identifiersMatch(schedule.tourId, tour.id) && matchesSchedule(schedule),
          )
          .map(
            (schedule): AssignedTourSchedule => ({
              schedule,
              activeStatus: activeBySchedule.get(Number(schedule.id)) ?? null,
            }),
          ),
        assignment,
      }))
      .filter((item) => includeWithoutSchedules || item.schedules.length > 0);
  }
}
