import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Profile } from '../../../domain/model/profile.entity';
import { ProfileRole } from '../../../domain/model/profile-role';
import { ProfilesStore } from '../../../application/profiles.store';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './profile-view.html',
  styleUrl: './profile-view.css',
})
export class ProfileView {
  readonly store = inject(ProfilesStore);
  readonly profiles = this.store.profiles;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  #translate = inject(TranslateService);
  #destroyRef = inject(DestroyRef);
  #route = inject(ActivatedRoute);
  #selectedProfileId = signal<number | null>(null);

  readonly selectedProfile = computed(() =>
    this.profiles().find((profile) => profile.id === this.#selectedProfileId()),
  );

  constructor() {
    this.loadProfiles();
  }

  loadProfiles(): void {
    this.store
      .loadProfiles()
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        catchError(() => EMPTY),
      )
      .subscribe((profiles) => {
        const selectedId = Number(this.#route.snapshot.queryParamMap.get('profileId'));
        if (Number.isSafeInteger(selectedId) && profiles.some((profile) => profile.id === selectedId)) {
          this.#selectedProfileId.set(selectedId);
        }
      });
  }

  selectProfileFromEvent(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }

    const value = event.target.value;
    if (value === '') {
      this.#selectedProfileId.set(null);
      return;
    }

    const id = Number(value);
    if (Number.isSafeInteger(id) && this.profiles().some((profile) => profile.id === id)) {
      this.#selectedProfileId.set(id);
    }
  }

  roleLabel(role: ProfileRole): string {
    return this.#translate.instant(`profiles.roles.${role.toLocaleLowerCase()}`);
  }

  initials(profile: Profile): string {
    const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toLocaleUpperCase();
    return initials || '?';
  }
}
