import {computed, inject, Service, Signal, signal, WritableSignal} from '@angular/core';
import {TourManagementApi} from '../infrastructure/tour-management-api';
import {Tour} from '../domain/model/tour.entity';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {retry} from 'rxjs';
import {TourSchedule} from '../domain/model/tour-schedule.entity';

@Service()
export class TourManagementStore {

  private readonly tourManagementApi: TourManagementApi = inject(TourManagementApi)

  #loadTours(): void {
    this.#loadingSignal.set(true)
    this.#errorSignal.set(null)
    this.tourManagementApi.getTours().pipe(takeUntilDestroyed()).subscribe({
      next: tours => {
        this.#toursSignal.set(tours)
        this.#loadingSignal.set(false)
        this.#errorSignal.set(null)
      },
      error: err => {
        this.#errorSignal.set(this.#formatError(err, 'Failed to load tours'))
        this.#loadingSignal.set(false)
      }
    })
  }

  #loadTourSchedules(): void {
    this.#loadingSignal.set(true)
    this.#errorSignal.set(null)

    this.tourManagementApi.getTourSchedules().pipe(takeUntilDestroyed()).subscribe({
      next: tourSchedules => {
        this.#tourSchedulesSignal.set(tourSchedules)
        this.#loadingSignal.set(false)
        this.#errorSignal.set(null)
      },
      error: err => {
        this.#errorSignal.set(this.#formatError(err, 'Failed to load tour schedules'))
        this.#loadingSignal.set(false)
      }
    })
  }

  #toursSignal: WritableSignal<Tour[]> = signal<Tour[]>([])
  #tourSchedulesSignal:  WritableSignal<TourSchedule[]> = signal<TourSchedule[]>([])

  readonly tours: Signal<Tour[]> = this.#toursSignal.asReadonly()
  readonly tourSchedules: Signal<TourSchedule[]> = this.#tourSchedulesSignal.asReadonly()

  #loadingSignal: WritableSignal<boolean> = signal<boolean>(false)

  readonly loading: Signal<boolean> = this.#loadingSignal.asReadonly()

  #errorSignal: WritableSignal<string | null> = signal<string | null>(null)

  readonly error: Signal<string | null> = this.#errorSignal.asReadonly()

  constructor() {
    this.#loadTours()
    this.#loadTourSchedules()
  }

  getTourById = (id: number): Signal<Tour | undefined> => {
    return computed(() => id ? this.tours().find(t => t.id === id) : undefined)
  }

  getTourScheduleById = (id: number): Signal<TourSchedule | undefined> => {
    return computed(() => id ? this.tourSchedules().find(ts => ts.id === id) : undefined)
  }

  addTour = (tour: Tour): void => {
    this.#loadingSignal.set(true)
    this.#errorSignal.set(null)
    this.tourManagementApi.createTour(tour).pipe(retry(2)).subscribe({
      next: createdTour => {
        this.#toursSignal.update(tours => [...tours, createdTour])
        this.#loadingSignal.set(false)
        this.#errorSignal.set(null)
      },
      error: err => {
        this.#errorSignal.set(this.#formatError(err, 'Failed to create tour'))
        this.#loadingSignal.set(false)
      }
    })
  }

  addTourSchedule = (tourSchedule: TourSchedule): void => {
    this.#loadingSignal.set(true)
    this.#errorSignal.set(null)
    this.tourManagementApi.createTourSchedule(tourSchedule).pipe(retry(2)).subscribe({
      next: createdTourSchedule => {
        this.#tourSchedulesSignal.update(tourSchedules => [...tourSchedules, createdTourSchedule])
        this.#loadingSignal.set(false)
        this.#errorSignal.set(null)
      },
      error: err => {
        this.#errorSignal.set(this.#formatError(err,'Failed to create tour schedule'))
        this.#loadingSignal.set(false)
      }
    })
  }

  updateTour = (updatedTour: Tour): void => {
    this.#loadingSignal.set(true)
    this.#errorSignal.set(null)
    this.tourManagementApi.updateTour(updatedTour).pipe(retry(2)).subscribe({
      next: tour => {
        this.#toursSignal.update(tours => tours.map(t => t.id === tour.id ? tour : t))
        this.#loadingSignal.set(false)
        this.#errorSignal.set(null)
      },
      error: err => {
        this.#errorSignal.set(this.#formatError(err, 'Failed to update tour'))
        this.#loadingSignal.set(false)
      }
    })
  }

  updateTourSchedule = (tourSchedule: TourSchedule): void => {
    this.#loadingSignal.set(true)
    this.#errorSignal.set(null)
    this.tourManagementApi.updateTourSchedule(tourSchedule).pipe(retry(2)).subscribe({
      next: tourSchedule => {
        this.#tourSchedulesSignal.update(tourSchedules => tourSchedules.map(ts => ts.id === tourSchedule.id ? tourSchedule : ts))
        this.#loadingSignal.set(false)
        this.#errorSignal.set(null)
      },
      error: err => {
        this.#errorSignal.set(this.#formatError(err, 'Failed to update tour schedule'))
        this.#loadingSignal.set(false)
      }
    })
  }

  deleteTour = (id:number): void => {
    this.#loadingSignal.set(true)
    this.#errorSignal.set(null)
    this.tourManagementApi.deleteTour(id).pipe(retry(2)).subscribe({
      next: () => {
        this.#toursSignal.update(tours => tours.filter(t => t.id !== id))
        this.#loadingSignal.set(false)
        this.#errorSignal.set(null)
      },
      error: err => {
        this.#errorSignal.set(this.#formatError(err, 'Failed to delete tour'))
        this.#loadingSignal.set(false)
      }
    })
  }

  deleteTourSchedule = (id: number): void => {
    this.#loadingSignal.set(true)
    this.#errorSignal.set(null)
    this.tourManagementApi.deleteTourSchedule(id).pipe(retry(2)).subscribe({
      next: () => {
        this.#tourSchedulesSignal.update(tourSchedules => tourSchedules.filter(ts => ts.id !== id))
        this.#loadingSignal.set(false)
        this.#errorSignal.set(null)
      },
      error: err => {
        this.#errorSignal.set(this.#formatError(err, 'Failed to delete tour schedule'))
        this.#loadingSignal.set(false)
      }
    })
  }


  #formatError = (error: unknown, fallback: string): string => {
    if (error instanceof Error) {
      return error.message.includes('Resource not found') ? `${fallback}: Not found` : error.message;
    }
    return fallback;
  }

}
