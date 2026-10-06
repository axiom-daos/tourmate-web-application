import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { Observable, finalize, retry } from 'rxjs';
import { Agency } from '../domain/model/agency.entity';
import { TourGuide } from '../domain/model/tour-guide.entity';
import { User } from '../domain/model/user.entity';
import { IamApi } from '../infrastructure/iam-api';

@Injectable({ providedIn: 'root' })
export class IamStore {
  #api = inject(IamApi);
  #pendingRequests = 0;

  #usersSignal = signal<User[]>([]);
  readonly users = this.#usersSignal.asReadonly();

  #agenciesSignal = signal<Agency[]>([]);
  readonly agencies = this.#agenciesSignal.asReadonly();

  #tourGuidesSignal = signal<TourGuide[]>([]);
  readonly tourGuides = this.#tourGuidesSignal.asReadonly();

  #loadingSignal = signal(false);
  readonly loading = this.#loadingSignal.asReadonly();

  #errorSignal = signal<string | null>(null);
  readonly error = this.#errorSignal.asReadonly();

  readonly userCount = computed(() => this.users().length);
  readonly agencyCount = computed(() => this.agencies().length);
  readonly tourGuideCount = computed(() => this.tourGuides().length);

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    this.loadUsers();
    this.loadAgencies();
    this.loadTourGuides();
  }

  loadUsers(): void {
    this.#execute(
      this.#api.getUsers(),
      (users) => {
        this.#usersSignal.set(users);
        this.assignUsersToTourGuides();
      },
      'Failed to load users',
    );
  }

  loadAgencies(): void {
    this.#execute(
      this.#api.getAgencies(),
      (agencies) => this.#agenciesSignal.set(agencies),
      'Failed to load agencies',
    );
  }

  loadTourGuides(): void {
    this.#execute(
      this.#api.getTourGuides(),
      (tourGuides) => {
        this.#tourGuidesSignal.set(tourGuides);
        this.assignUsersToTourGuides();
      },
      'Failed to load tour guides',
    );
  }

  getUserById = (id: number): Signal<User | undefined> =>
    computed(() => this.users().find((user) => user.id === id));

  getAgencyById = (id: number): Signal<Agency | undefined> =>
    computed(() => this.agencies().find((agency) => agency.id === id));

  getTourGuideById = (id: number): Signal<TourGuide | undefined> =>
    computed(() => this.tourGuides().find((tourGuide) => tourGuide.id === id));

  addUser(user: User): void {
    this.#execute(
      this.#api.createUser(user),
      (created) => this.#usersSignal.update((users) => [...users, created]),
      'Failed to create user',
    );
  }

  updateUser(user: User): void {
    this.#execute(
      this.#api.updateUser(user),
      (updated) =>
        this.#usersSignal.update((users) =>
          users.map((existing) => (existing.id === updated.id ? updated : existing)),
        ),
      'Failed to update user',
    );
  }

  deleteUser(id: number): void {
    this.#execute(
      this.#api.deleteUser(id),
      () => this.#usersSignal.update((users) => users.filter((user) => user.id !== id)),
      'Failed to delete user',
    );
  }

  addAgency(agency: Agency): void {
    this.#execute(
      this.#api.createAgency(agency),
      (created) => this.#agenciesSignal.update((agencies) => [...agencies, created]),
      'Failed to create agency',
    );
  }

  updateAgency(agency: Agency): void {
    this.#execute(
      this.#api.updateAgency(agency),
      (updated) =>
        this.#agenciesSignal.update((agencies) =>
          agencies.map((existing) => (existing.id === updated.id ? updated : existing)),
        ),
      'Failed to update agency',
    );
  }

  deleteAgency(id: number): void {
    this.#execute(
      this.#api.deleteAgency(id),
      () => this.#agenciesSignal.update((agencies) => agencies.filter((agency) => agency.id !== id)),
      'Failed to delete agency',
    );
  }

  addTourGuide(tourGuide: TourGuide): void {
    this.#execute(
      this.#api.createTourGuide(tourGuide),
      (created) => this.#tourGuidesSignal.update((guides) => [...guides, created]),
      'Failed to create tour guide',
    );
  }

  updateTourGuide(tourGuide: TourGuide): void {
    this.#execute(
      this.#api.updateTourGuide(tourGuide),
      (updated) =>
        this.#tourGuidesSignal.update((guides) =>
          guides.map((existing) => (existing.id === updated.id ? updated : existing)),
        ),
      'Failed to update tour guide',
    );
  }

  private assignUsersToTourGuides = (): void => {
    this.#tourGuidesSignal.update(tourGuides =>
      tourGuides.map(tourGuide => this.assignUserToTourGuide(tourGuide)),
    );
  };

  private assignUserToTourGuide = (tourGuide: TourGuide): TourGuide => {
    const userId = tourGuide.userId ?? 0;
    tourGuide.user = userId ? this.getUserById(userId)() ?? null : null;
    return tourGuide;
  }

  deleteTourGuide(id: number): void {
    this.#execute(
      this.#api.deleteTourGuide(id),
      () => this.#tourGuidesSignal.update((guides) => guides.filter((guide) => guide.id !== id)),
      'Failed to delete tour guide',
    );
  }

  #execute<T>(request: Observable<T>, onSuccess: (result: T) => void, fallback: string): void {
    this.#pendingRequests += 1;
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    request
      .pipe(
        retry(2),
        finalize(() => {
          this.#pendingRequests -= 1;
          this.#loadingSignal.set(this.#pendingRequests > 0);
        }),
      )
      .subscribe({
        next: onSuccess,
        error: (error: unknown) => this.#errorSignal.set(this.#formatError(error, fallback)),
      });
  }

  #formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }
}
