import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, defer, finalize, tap, throwError } from 'rxjs';
import { Profile } from '../domain/model/profile.entity';
import { ProfilesApi } from '../infrastructure/profiles-api';

@Injectable({ providedIn: 'root' })
export class ProfilesStore {
  #api = inject(ProfilesApi);
  #profilesSignal = signal<Profile[]>([]);
  #loadingSignal = signal(false);
  #errorSignal = signal<string | null>(null);

  readonly profiles = this.#profilesSignal.asReadonly();
  readonly loading = this.#loadingSignal.asReadonly();
  readonly error = this.#errorSignal.asReadonly();
  loadProfiles(): Observable<Profile[]> {
    return defer(() => {
      this.#loadingSignal.set(true);
      this.#errorSignal.set(null);

      return this.#api.getProfiles().pipe(
        tap((profiles) => this.#profilesSignal.set(profiles)),
        catchError((error: unknown) => this.#handleError(error, 'Failed to load profiles')),
        finalize(() => this.#loadingSignal.set(false)),
      );
    });
  }

  #handleError(error: unknown, fallback: string): Observable<never> {
    const message = error instanceof Error ? error.message : fallback;
    this.#errorSignal.set(message);
    return throwError(() => error);
  }
}
