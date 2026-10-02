import {inject, Service, Signal, signal, WritableSignal} from '@angular/core';
import {TourManagementApi} from '../infrastructure/tour-management-api';
import {Tour} from '../domain/model/tour.entity';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

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

  #toursSignal: WritableSignal<Tour[]> = signal<Tour[]>([])

  readonly tours: Signal<Tour[]> = this.#toursSignal.asReadonly()

  #loadingSignal: WritableSignal<boolean> = signal<boolean>(false)

  readonly loading: Signal<boolean> = this.#loadingSignal.asReadonly()

  #errorSignal: WritableSignal<string | null> = signal<string | null>(null)

  readonly error: Signal<string | null> = this.#errorSignal.asReadonly()

  constructor() {
    this.#loadTours()
  }



















  #formatError = (error: unknown, fallback: string): string => {
    if (error instanceof Error) {
      return error.message.includes('Resource not found') ? `${fallback}: Not found` : error.message;
    }
    return fallback;
  }

}
