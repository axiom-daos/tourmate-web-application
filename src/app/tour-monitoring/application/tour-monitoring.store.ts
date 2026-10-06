import {computed, DestroyRef, inject, Injectable, Signal, signal} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {EMPTY, catchError, distinctUntilChanged, finalize, retry, switchMap, tap} from 'rxjs';
import {ActiveTour} from '../domain/model/active-tour.entity';
import {TourMonitoringApi} from '../infrastructure/tour-monitoring-api';
import {TourGuide} from '../../iam/domain/model/tour-guide.entity';
import {Participant} from '../domain/model/participant.entity';
import {TourSchedule} from '../../tour-management/domain/model/tour-schedule.entity';
import {IamApi} from '../../iam/infrastructure/iam-api';
import {User} from '../../iam/domain/model/user.entity';
import {Checkpoint} from '../../tour-management/domain/model/checkpoint.entity';
import {Tour} from '../../tour-management/domain/model/tour.entity';
import {TourManagementApi} from '../../tour-management/infrastructure/tour-management-api';
import {IncidentStatus} from '../../safety-and-incident-management/domain/model/value-object/incident-status';
import {IncidentStore} from '../../safety-and-incident-management/application/incident.store';

export interface MapPoint {
  x: number;
  y: number;
}

export interface GeographicCoordinates {
  latitude: number;
  longitude: number;
}

export interface PositionedCheckpoint extends MapPoint {
  checkpoint: Checkpoint;
}

export interface PositionedIncident extends MapPoint {
  id: number;
  reporterName: string;
}

export function projectCoordinate(
  latitude: number,
  longitude: number,
  coordinates: Array<{latitude: number; longitude: number}>,
): MapPoint {
  if (coordinates.length === 0) {
    return {x: 500, y: 280};
  }

  const longitudes = coordinates.map(coordinate => coordinate.longitude);
  const latitudes = coordinates.map(coordinate => coordinate.latitude);
  const longitudeSpan = Math.max(...longitudes) - Math.min(...longitudes) || 0.01;
  const latitudeSpan = Math.max(...latitudes) - Math.min(...latitudes) || 0.01;
  const longitudePadding = longitudeSpan * 0.12;
  const latitudePadding = latitudeSpan * 0.12;
  const minLongitude = Math.min(...longitudes) - longitudePadding;
  const maxLongitude = Math.max(...longitudes) + longitudePadding;
  const minLatitude = Math.min(...latitudes) - latitudePadding;
  const maxLatitude = Math.max(...latitudes) + latitudePadding;

  return {
    x: 85 + ((longitude - minLongitude) / (maxLongitude - minLongitude)) * 830,
    y: 410 - ((latitude - minLatitude) / (maxLatitude - minLatitude)) * 300,
  };
}

/**
 * Holds tourMonitoring application state and coordinates activeTour application layer behavior.
 */
@Injectable({
  providedIn: 'root'
})
export class TourMonitoringStore {
  private readonly tourMonitoringApi = inject(TourMonitoringApi);
  private readonly tourManagementApi = inject(TourManagementApi);
  private readonly iamApi = inject(IamApi);
  private readonly incidentStore = inject(IncidentStore);
  private readonly destroyRef = inject(DestroyRef);


  readonly activeTourCount = computed(() => this.activeTours().length);
  readonly tourGuideCount = computed(() => this.tourGuides().length);
  readonly tourScheduleCount = computed(() => this.tourSchedules().length);
  readonly participantCount = computed(() => this.participants().length);


  private readonly activeToursSignal = signal<ActiveTour[]>([]);
  readonly activeTours = this.activeToursSignal.asReadonly();

  private readonly tourGuidesSignal = signal<TourGuide[]>([]);
  readonly tourGuides = this.tourGuidesSignal.asReadonly();

  private readonly tourSchedulesSignal = signal<TourSchedule[]>([]);
  readonly tourSchedules = this.tourSchedulesSignal.asReadonly();

  private readonly participantsSignal = signal<Participant[]>([]);
  readonly participants = this.participantsSignal.asReadonly();

  private readonly toursSignal = signal<Tour[]>([]);
  readonly tours = this.toursSignal.asReadonly();

  private readonly usersSignal = signal<User[]>([]);
  readonly users = this.usersSignal.asReadonly();

  private readonly checkpointsSignal = signal<Checkpoint[]>([]);
  readonly checkpoints = this.checkpointsSignal.asReadonly();

  private readonly scheduleStartCoordinatesSignal = signal<GeographicCoordinates | null>(null);
  readonly scheduleStartCoordinates = this.scheduleStartCoordinatesSignal.asReadonly();
  private scheduleCoordinatesRequest = 0;

  private readonly checkpointLoadingSignal = signal(false);
  readonly checkpointLoading = this.checkpointLoadingSignal.asReadonly();

  readonly activeTourId = signal<number | null>(null);
  readonly selectedActiveTour = computed(() => {
    const activeTours = this.activeTours();
    const selectedId = this.activeTourId();
    if (selectedId !== null) {
      return activeTours.find(tour => tour.id === selectedId) ?? null;
    }
    return activeTours.find(tour => tour.status === 'IN_PROGRESS') ??
      activeTours[0] ??
      null;
  });

  readonly selectedSchedule = computed(() => {
    const scheduleId = this.selectedActiveTour()?.tourScheduleId;
    return this.tourSchedules().find(schedule => schedule.id === scheduleId) ?? null;
  });

  readonly selectedTour = computed(() => {
    const tourId = this.selectedSchedule()?.tourId;
    return this.tours().find(tour => tour.id === tourId) ?? null;
  });

  readonly activeExpeditionOptions = computed(() =>
    this.activeTours()
      .filter(activeTour =>
        activeTour.status === 'IN_PROGRESS' || activeTour.id === this.activeTourId(),
      )
      .map(activeTour => {
        const schedule = this.tourSchedules().find(
          candidate => candidate.id === activeTour.tourScheduleId,
        );
        const tour = this.tours().find(candidate => candidate.id === schedule?.tourId);
        return {
          activeTour,
          title: tour?.details.title ?? `#${activeTour.id}`,
        };
      }),
  );

  readonly routeCheckpoints = computed(() =>
    [...this.checkpoints()].sort((left, right) => left.orderIndex - right.orderIndex),
  );

  readonly coordinates = computed(() => {
    const points = this.routeCheckpoints().map(checkpoint => ({
      latitude: checkpoint.latitude,
      longitude: checkpoint.longitude,
    }));
    const activeTour = this.selectedActiveTour();
    if (activeTour) {
      points.push({
        latitude: activeTour.currentLatitude,
        longitude: activeTour.currentLongitude,
      });
    }
    for (const incident of this.selectedIncidents()) {
      points.push({latitude: incident.latitude, longitude: incident.longitude});
    }
    return points;
  });

  readonly positionedCheckpoints = computed<PositionedCheckpoint[]>(() =>
    this.routeCheckpoints().map(checkpoint => ({
      checkpoint,
      ...projectCoordinate(checkpoint.latitude, checkpoint.longitude, this.coordinates()),
    })),
  );

  readonly routePoints = computed(() =>
    this.positionedCheckpoints()
      .map(({x, y}) => `${x},${y}`)
      .join(' '),
  );

  readonly currentPosition = computed<MapPoint | null>(() => {
    const activeTour = this.selectedActiveTour();
    return activeTour
      ? projectCoordinate(activeTour.currentLatitude, activeTour.currentLongitude, this.coordinates())
      : null;
  });

  readonly participantsForTour = computed(() => {
    const scheduleId = this.selectedActiveTour()?.tourScheduleId;
    return scheduleId
      ? this.participants().filter(participant => participant.tourScheduleId === scheduleId)
      : [];
  });

  readonly participantCards = computed(() => {
    const usersById = new Map(this.users().map(user => [user.id, user]));
    return this.participantsForTour().map(participant => ({
      participant,
      user: usersById.get(participant.userId) ?? null,
      displayName: this.displayName(usersById.get(participant.userId), participant.userId),
    }));
  });

  readonly currentGuide = computed(() => {
    const guideId = this.selectedActiveTour()?.guideId;
    return this.tourGuides().find(guide => guide.id === guideId) ?? null;
  });

  readonly guideName = computed(() => {
    const guide = this.currentGuide();
    return guide
      ? this.displayName(this.users().find(user => user.id === guide.userId), guide.userId)
      : null;
  });

  readonly selectedIncidents = computed(() => {
    const activeTourId = this.selectedActiveTour()?.id;
    return this.incidentStore.incidents().filter(
      incident =>
        incident.activeTourId === activeTourId &&
        incident.status !== IncidentStatus.RESOLVED &&
        incident.status !== IncidentStatus.CLOSED,
    );
  });

  readonly positionedIncidents = computed<PositionedIncident[]>(() => {
    const usersById = new Map(this.users().map(user => [user.id, user]));
    return this.selectedIncidents().map(incident => ({
      id: incident.id,
      reporterName: this.displayName(usersById.get(incident.reportedByUserId), incident.reportedByUserId),
      ...projectCoordinate(incident.latitude, incident.longitude, this.coordinates()),
    }));
  });

  readonly alertCount = computed(() =>
    this.incidentStore.incidents().filter(
      incident =>
        incident.status !== IncidentStatus.RESOLVED &&
        incident.status !== IncidentStatus.CLOSED,
    ).length,
  );



  private readonly loadingSignal = signal<boolean>(false);

  /**
   * Readonly signal indicating if data is loading.
   */
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);

  /**
   * Readonly signal for the current error message.
   */
  readonly error = this.errorSignal.asReadonly();

  /**
   * Creates an instance of TourMonitoringStore and loads initial data.
   */
  constructor() {

    this.loadActiveTours();
    this.loadTourGuides();
    this.loadTourSchedules();
    this.loadParticipants();
    this.loadUsers();
    this.loadTours();
    this.watchRouteCheckpoints();
  }

  selectActiveTour(id: number | null): void {
    this.activeTourId.set(id);
  }

  loadScheduleStartCoordinates(scheduleId: number): void {
    const schedule = this.tourSchedules().find(candidate => candidate.id === scheduleId);
    const request = ++this.scheduleCoordinatesRequest;
    this.scheduleStartCoordinatesSignal.set(null);
    if (!schedule) return;

    this.tourManagementApi.getCheckpointsForTour(schedule.tourId).pipe(
      retry(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: checkpoints => {
        if (request !== this.scheduleCoordinatesRequest) return;
        const start = [...checkpoints].sort((left, right) => left.orderIndex - right.orderIndex)[0];
        this.scheduleStartCoordinatesSignal.set(
          start ? {latitude: start.latitude, longitude: start.longitude} : null,
        );
      },
      error: error => {
        if (request === this.scheduleCoordinatesRequest) {
          this.errorSignal.set(this.formatError(error, 'Unable to load route start coordinates'));
        }
      },
    });
  }

  private loadUsers(): void {
    this.iamApi.getUsers().pipe(
      retry(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: users => {
        this.usersSignal.set(users);
        this.assignUsersToTourGuides();
      },
      error: error => this.errorSignal.set(this.formatError(error, 'Unable to load expedition data')),
    });
  }

  private loadTours(): void {
    this.tourManagementApi.getTours().pipe(
      retry(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: tours => {
        this.toursSignal.set(tours);
        this.assignToursToTourSchedules();
      },
      error: error => this.errorSignal.set(this.formatError(error, 'Unable to load expedition data')),
    });
  }

  private watchRouteCheckpoints(): void {
    toObservable(this.selectedTour)
      .pipe(
        distinctUntilChanged((previous, current) => previous?.id === current?.id),
        switchMap(tour => {
          if (!tour) {
            this.checkpointsSignal.set([]);
            this.checkpointLoadingSignal.set(false);
            return EMPTY;
          }

          this.checkpointLoadingSignal.set(true);
          return this.tourManagementApi.getCheckpointsForTour(tour.id).pipe(
            retry(1),
            tap(() => this.errorSignal.set(null)),
            catchError(error => {
              this.errorSignal.set(this.formatError(error, 'Unable to load route checkpoints'));
              this.checkpointsSignal.set([]);
              return EMPTY;
            }),
            finalize(() => this.checkpointLoadingSignal.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(checkpoints => this.checkpointsSignal.set(checkpoints));
  }

  private displayName(user: User | undefined, userId: number): string {
    return user ? `${user.firstName} ${user.lastName}` : `#${userId}`;
  }

  /**
   * Selects a activeTour by identifier.
   * @param id - ActiveTour identifier.
   * @returns Reactive selection for the requested activeTour.
   */
  getActiveTourById = (id: number): Signal<ActiveTour | undefined> => {
    return computed(() => id ? this.activeTours().find(c => c.id === id) : undefined);
  }

  /**
   * adds a new activeTour.
   * @param activeTour - The activeTour to add.
   */
  addActiveTour = (activeTour: ActiveTour): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.createActiveTour(activeTour).pipe(retry(2)).subscribe({
      next: createdActiveTour => {
        const assignedActiveTour = this.assignTourGuideToActiveTour(
          this.assignTourScheduleToActiveTour(createdActiveTour),
        );
        this.activeToursSignal.update(activeTours => [...activeTours, assignedActiveTour]);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to create activeTour'));
        this.loadingSignal.set(false);
      }
    });
  };

  /**
   * Updates an existing activeTour.
   * @param updatedActiveTour - The activeTour to update.
   */
  updateActiveTour = (updatedActiveTour: ActiveTour): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.updateActiveTour(updatedActiveTour).pipe(retry(2)).subscribe({
      next: activeTour => {
        activeTour = this.assignTourScheduleToActiveTour(activeTour);
        activeTour = this.assignTourGuideToActiveTour(activeTour);
        this.activeToursSignal.update(activeTours =>
          activeTours.map(c => c.id === activeTour.id ? activeTour : c)
        );
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to update activeTour'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Deletes a activeTour by ID.
   * @param id - The ID of the activeTour to delete.
   */
  deleteActiveTour = (id: number): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.deleteActiveTour(id).pipe(retry(2)).subscribe({
      next: () => {
        this.activeToursSignal.update(activeTours => activeTours.filter(c => c.id !== id));
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to delete activeTour'));
        this.loadingSignal.set(false);
      }
    });
  }



  /**
   * Loads all activeTours from the API.
   */
  private loadActiveTours = (): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.getActiveTours().pipe(takeUntilDestroyed()).subscribe({
      next: activeTours => {
        console.log(activeTours);
        this.activeToursSignal.set(activeTours);
        this.loadingSignal.set(false);
        this.errorSignal.set(null);
        this.assignTourSchedulesToActiveTours();
        this.assignTourGuidesToActiveTours();
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load activeTours'));
        this.loadingSignal.set(false);
      }
    });
  };



  getTourGuideById = (id: number): Signal<TourGuide | undefined> => {
    return computed(() => id ? this.tourGuides().find(c => c.id === id) : undefined);
  }

  /**
   * adds a new tourGuide.
   * @param tourGuide - The tourGuide to add.
   */
  addTourGuide = (tourGuide: TourGuide): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.createTourGuide(tourGuide).pipe(retry(2)).subscribe({
      next: createdTourGuide => {

        this.tourGuidesSignal.update(tourGuides => [...tourGuides, createdTourGuide]);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to create tourGuide'));
        this.loadingSignal.set(false);
      }
    });
  };

  /**
   * Updates an existing tourGuide.
   * @param updatedTourGuide - The tourGuide to update.
   */
  updateTourGuide = (updatedTourGuide: TourGuide): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.updateTourGuide(updatedTourGuide).pipe(retry(2)).subscribe({
      next: tourGuide => {

        this.tourGuidesSignal.update(tourGuides =>
          tourGuides.map(c => c.id === tourGuide.id ? tourGuide : c)
        );
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to update tourGuide'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Deletes a tourGuide by ID.
   * @param id - The ID of the tourGuide to delete.
   */
  deleteTourGuide = (id: number): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.deleteTourGuide(id).pipe(retry(2)).subscribe({
      next: () => {
        this.tourGuidesSignal.update(tourGuides => tourGuides.filter(c => c.id !== id));
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to delete tourGuide'));
        this.loadingSignal.set(false);
      }
    });
  }

  private loadTourGuides = (): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.getTourGuides().pipe(takeUntilDestroyed()).subscribe({
      next: tourGuides => {
        console.log(tourGuides);
        this.tourGuidesSignal.set(tourGuides);
        this.loadingSignal.set(false);
        this.errorSignal.set(null);
        this.assignUsersToTourGuides();
        this.assignTourGuidesToActiveTours();
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load tourGuides'));
        this.loadingSignal.set(false);
      }
    });
  };



  getTourScheduleById = (id: number): Signal<TourSchedule | undefined> => {
    return computed(() => id ? this.tourSchedules().find(c => c.id === id) : undefined);
  }
  /**
   * adds a new tourSchedule.
   * @param tourSchedule - The tourSchedule to add.
   */
  addTourSchedule = (tourSchedule: TourSchedule): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.createTourSchedule(tourSchedule).pipe(retry(2)).subscribe({
      next: createdTourSchedule => {

        this.tourSchedulesSignal.update(tourSchedules => [...tourSchedules, createdTourSchedule]);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to create tourSchedule'));
        this.loadingSignal.set(false);
      }
    });
  };

  /**
   * Updates an existing tourSchedule.
   * @param updatedTourSchedule - The tourSchedule to update.
   */
  updateTourSchedule = (updatedTourSchedule: TourSchedule): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.updateTourSchedule(updatedTourSchedule).pipe(retry(2)).subscribe({
      next: tourSchedule => {

        this.tourSchedulesSignal.update(tourSchedules =>
          tourSchedules.map(c => c.id === tourSchedule.id ? tourSchedule : c)
        );
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to update tourSchedule'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Deletes a tourSchedule by ID.
   * @param id - The ID of the tourSchedule to delete.
   */
  deleteTourSchedule = (id: number): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.deleteTourSchedule(id).pipe(retry(2)).subscribe({
      next: () => {
        this.tourSchedulesSignal.update(tourSchedules => tourSchedules.filter(c => c.id !== id));
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to delete tourSchedule'));
        this.loadingSignal.set(false);
      }
    });
  }

  private loadTourSchedules = (): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.getTourSchedules().pipe(takeUntilDestroyed()).subscribe({
      next: tourSchedules => {
        console.log(tourSchedules);
        this.tourSchedulesSignal.set(tourSchedules);
        this.assignToursToTourSchedules();
        this.assignTourSchedulesToActiveTours();
        //this.assignTourSchedulesToParticipants();
        this.loadingSignal.set(false);
        this.errorSignal.set(null);



      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load tourSchedules'));
        this.loadingSignal.set(false);
      }
    });
  };

  getParticipantById = (id: number): Signal<Participant | undefined> => {
    return computed(() => id ? this.participants().find(c => c.id === id) : undefined);
  }

  /**
   * adds a new participant.
   * @param participant - The participant to add.
   */
  addParticipant = (participant: Participant): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.createParticipant(participant).pipe(retry(2)).subscribe({
      next: createdParticipant => {
        const assignedParticipant = this.assignTourScheduleToParticipant(createdParticipant);
        this.participantsSignal.update(participants => [...participants, assignedParticipant]);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to create participant'));
        this.loadingSignal.set(false);
      }
    });
  };

  /**
   * Updates an existing participant.
   * @param updatedParticipant - The participant to update.
   */
  updateParticipant = (updatedParticipant: Participant): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.updateParticipant(updatedParticipant).pipe(retry(2)).subscribe({
      next: participant => {
        participant = this.assignTourScheduleToParticipant(participant);
        this.participantsSignal.update(participants =>
          participants.map(c => c.id === participant.id ? participant : c)
        );
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to update participant'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Deletes a participant by ID.
   * @param id - The ID of the participant to delete.
   */
  deleteParticipant = (id: number): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.deleteParticipant(id).pipe(retry(2)).subscribe({
      next: () => {
        this.participantsSignal.update(participants => participants.filter(c => c.id !== id));
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to delete participant'));
        this.loadingSignal.set(false);
      }
    });
  }
  private loadParticipants = (): void => {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tourMonitoringApi.getParticipants().pipe(takeUntilDestroyed()).subscribe({
      next: participants => {
        console.log(participants);
        this.participantsSignal.set(participants);
        this.loadingSignal.set(false);
        this.errorSignal.set(null);
        this.assignTourSchedulesToParticipants();


      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load participants'));
        this.loadingSignal.set(false);
      }
    });
  };

  private assignTourSchedulesToParticipants = (): void => {
    this.participantsSignal.update(participants => participants.map(participant => this.assignTourScheduleToParticipant(participant)));
  };

  private assignTourScheduleToParticipant = (participant: Participant): Participant => {
    const tourScheduleId = participant.tourScheduleId ?? 0;
    participant.tourSchedule = tourScheduleId ? this.getTourScheduleById(tourScheduleId)() ?? null : null;
    return participant;
  }

  private assignTourSchedulesToActiveTours = (): void => {
    this.activeToursSignal.update(activeTours => activeTours.map(activeTour => this.assignTourScheduleToActiveTour(activeTour)));
  };

  private assignToursToTourSchedules = (): void => {
    this.tourSchedulesSignal.update(tourSchedules =>
      tourSchedules.map(tourSchedule => {
        tourSchedule.tour = this.tours().find(tour => tour.id === tourSchedule.tourId) ?? null;
        return tourSchedule;
      }),
    );
    this.assignTourSchedulesToActiveTours();
  };

  private assignTourScheduleToActiveTour = (activeTour: ActiveTour): ActiveTour => {
    const tourScheduleId = activeTour.tourScheduleId ?? 0;
    activeTour.tourSchedule = tourScheduleId ? this.getTourScheduleById(tourScheduleId)() ?? null : null;
    return activeTour;
  }

  private assignTourGuidesToActiveTours = (): void => {
    this.activeToursSignal.update(activeTours =>
      activeTours.map(activeTour => this.assignTourGuideToActiveTour(activeTour)),
    );
  };

  private assignUsersToTourGuides = (): void => {
    this.tourGuidesSignal.update(tourGuides =>
      tourGuides.map(tourGuide => this.assignUserToTourGuide(tourGuide)),
    );
    this.assignTourGuidesToActiveTours();
  };

  private assignUserToTourGuide = (tourGuide: TourGuide): TourGuide => {
    const user = this.users().find(candidate => candidate.id === tourGuide.userId) ?? null;
    tourGuide.user = user;
    return tourGuide;
  };

  private assignTourGuideToActiveTour = (activeTour: ActiveTour): ActiveTour => {
    const tourGuideId = activeTour.guideId ?? 0;
    activeTour.guide = tourGuideId ? this.getTourGuideById(tourGuideId)() ?? null : null;
    return activeTour;
  }


  /**
   * Normalizes unknown errors into a display-friendly message.
   * @param error - Source error.
   * @param fallback - Default message when details are unavailable.
   * @returns Normalized message.
   */
  private formatError = (error: unknown, fallback: string): string => {
    if (error instanceof Error) {
      return error.message.includes('Resource not found') ? `${fallback}: Not found` : error.message;
    }
    return fallback;
  }
}
