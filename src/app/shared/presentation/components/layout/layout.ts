import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { FooterContent } from '../footer-content/footer-content';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular/material/sidenav';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    RouterLinkActive,
    TranslatePipe,
    LanguageSwitcher,
    FooterContent,
    MatSidenavContent,
    MatSidenav,
    MatSidenavContainer,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  protected readonly isMobile = signal(
    typeof window !== 'undefined' && window.innerWidth <= 760,
  );
  protected readonly sidebarOpen = signal(!this.isMobile());

  /**
   * Array of navigation options using i18n translation keys.
   */
  options = signal([
    { link: '/home', label: 'option.home', icon: 'dashboard' },
    { link: '/management/tours', label: 'option.management', icon: 'terrain' },
    { link: '/monitoring', label: 'option.monitoring', icon: 'sensors' },
    {
      link: '/safety-and-incident-management',
      label: 'option.safety_and_incident',
      icon: 'emergency',
    },
    { link: '/subscriptions', label: 'option.subscriptions', icon: 'credit_card' },
    { link: '/feedback-and-tour-reviews', label: 'option.feedback_and_reviews', icon: 'mode_comment' },
    { link: '/about', label: 'option.about', icon: 'info' }
  ]);

  @HostListener('window:resize')
  protected updateNavigationMode(): void {
    const mobile = window.innerWidth <= 760;
    if (mobile !== this.isMobile()) {
      this.isMobile.set(mobile);
      this.sidebarOpen.set(!mobile);
    }
  }

  protected closeNavigation(): void {
    if (this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }
}
