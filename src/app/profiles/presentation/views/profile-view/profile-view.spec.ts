import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { Profile } from '../../../domain/model/profile.entity';
import { ProfileRole } from '../../../domain/model/profile-role';
import { ProfilesStore } from '../../../application/profiles.store';
import { ProfileView } from './profile-view';

describe('ProfileView', () => {
  it('shows the selected existing profile', async () => {
    const profile = new Profile({
      id: 12,
      firstName: 'Ana',
      lastName: 'Ramos',
      email: 'ana@example.com',
      role: ProfileRole.GUIDE,
    });
    const fakeStore = {
      profiles: signal([profile]).asReadonly(),
      loading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      loadProfiles: () => of([profile]),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileView],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: ProfilesStore, useValue: fakeStore },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfileView);
    fixture.detectChanges();
    await fixture.whenStable();

    const select = fixture.nativeElement.querySelector('#profile-select') as HTMLSelectElement;
    select.value = String(profile.id);
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.profile-card') as HTMLElement | null;
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('Ana Ramos');
    expect(card?.textContent).toContain('ana@example.com');
    expect(card?.textContent).toContain('12');
  });
});
