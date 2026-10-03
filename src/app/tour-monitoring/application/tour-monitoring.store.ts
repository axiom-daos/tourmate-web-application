import {computed, inject, Injectable, Signal, signal} from '@angular/core';
import {ActiveTour} from '../domain/model/active-tour.entity';
import {TourMonitoringApi} from '../infrastructure/tour-monitoring-api';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {retry} from 'rxjs';
import {TourGuide} from '../domain/model/tour-guide.entity';
import {TourSchedule} from '../domain/model/tour-schedule.entity';
import {Participant} from '../domain/model/participant.entity';

/**
 * Holds tourMonitoring application state and coordinates activeTour application layer behavior.
 */
@Injectable({
  providedIn: 'root'
})
export class TourMonitoringStore {
  private readonly tourMonitoringApi = inject(TourMonitoringApi);


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
        createdActiveTour = this.assignTourScheduleToActiveTour(activeTour);
        this.activeToursSignal.update(activeTours => [...activeTours, createdActiveTour]);
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
        createdParticipant = this.assignTourScheduleToParticipant(participant);
        this.participantsSignal.update(participants => [...participants, createdParticipant]);
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

  private assignTourScheduleToActiveTour = (activeTour: ActiveTour): ActiveTour => {
    const tourScheduleId = activeTour.tourScheduleId ?? 0;
    activeTour.tourSchedule = tourScheduleId ? this.getTourScheduleById(tourScheduleId)() ?? null : null;
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
