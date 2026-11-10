import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, switchMap, throwError } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProfileToursStore } from '../../../application/profile-tours.store';
import { ProfilesStore } from '../../../application/profiles.store';
import { TourAssignment } from '../../../application/assigned-tour';
import { Profile } from '../../../domain/model/profile.entity';
import { ProfileRole } from '../../../domain/model/profile-role';

@Component({
  selector: 'app-profile-tours',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './profile-tours.html',
  styleUrl: './profile-tours.css',
})
export class ProfileTours {
  readonly store = inject(ProfileToursStore);
  readonly tours = this.store.tours;
  readonly loadingTours = this.store.loading;
  readonly error = this.store.error;

  #profilesStore = inject(ProfilesStore);
  #route = inject(ActivatedRoute);
  #translate = inject(TranslateService);
  #destroyRef = inject(DestroyRef);

  readonly profile = signal<Profile | null>(null);
  readonly loadingProfile = signal(true);
  readonly profileNotFound = signal(false);
  readonly profileLoadError = signal(false);

  constructor() {
    this.loadProfileAndTours();
  }

  loadProfileAndTours(): void {
    const id = Number(this.#route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.profileNotFound.set(true);
      this.loadingProfile.set(false);
      return;
    }

    this.profileNotFound.set(false);
    this.profileLoadError.set(false);
    this.loadingProfile.set(true);
    this.#profilesStore
      .loadProfiles()
      .pipe(
        switchMap((profiles) => {
          const profile = profiles.find((candidate) => candidate.id === id);
          if (!profile) {
            this.profileNotFound.set(true);
            return throwError(() => new Error('Profile not found'));
          }

          this.profile.set(profile);
          return this.store.loadForProfile(profile).pipe(catchError(() => EMPTY));
        }),
        catchError(() => {
          if (!this.profileNotFound()) {
            this.profileLoadError.set(true);
          }
          return EMPTY;
        }),
        finalize(() => this.loadingProfile.set(false)),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe();
  }

  roleLabel(role: ProfileRole): string {
    return this.#translate.instant(`profiles.roles.${role.toLocaleLowerCase()}`);
  }

  assignmentLabel(assignment: TourAssignment): string {
    return this.#translate.instant(`profiles.tours.assignment.${assignment}`);
  }

  statusLabel(status: string): string {
    return this.#translate.instant(`profiles.tours.status.${status.toLocaleLowerCase()}`);
  }

  difficultyLabel(difficulty: string): string {
    return this.#translate.instant(`profiles.tours.difficulty.${difficulty.toLocaleLowerCase()}`);
  }
}
