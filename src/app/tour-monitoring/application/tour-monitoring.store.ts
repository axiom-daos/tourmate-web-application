import {computed, inject, Injectable, Signal, signal} from '@angular/core';
import {ActiveTour} from '../domain/model/active-tour.entity';
import {TourMonitoringApi} from '../infrastructure/tour-monitoring-api';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {retry} from 'rxjs';
import {TourGuide} from '../domain/model/tour-guide.entity';

/**
 * Holds tourMonitoring application state and coordinates activeTour application layer behavior.
 */
@Injectable({
  providedIn: 'root'
})
export class TourMonitoringStore {
  private readonly tourMonitoringApi = inject(TourMonitoringApi);

  /**
   * Computed signal for the count of activeTours.
   */
  readonly activeTourCount = computed(() => this.activeTours().length);
  readonly tourGuideCount = computed(() => this.tourGuides().length);


  private readonly activeToursSignal = signal<ActiveTour[]>([]);

  /**
   * Readonly signal for the list of activeTours.
   */
  readonly activeTours = this.activeToursSignal.asReadonly();
  private readonly tourGuidesSignal = signal<TourGuide[]>([]);
  readonly tourGuides = this.tourGuidesSignal.asReadonly();





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
/**
  private assignCategoriesToActiveTours = (): void => {
    this.activeToursSignal.update(activeTours => activeTours.map(activeTour => this.assignCategoryToActiveTour(activeTour)));
  };

  private assignCategoryToActiveTour = (activeTour: ActiveTour): ActiveTour => {
    const categoryId = activeTour.categoryId ?? 0;
    activeTour.category = categoryId ? this.getCategoryById(categoryId)() ?? null : null;
    return activeTour;
  }
 */

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
