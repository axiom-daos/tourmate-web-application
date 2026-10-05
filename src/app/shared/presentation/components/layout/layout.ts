import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { FooterContent } from '../footer-content/footer-content';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
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
  /**
   * Array of navigation options using i18n translation keys.
   */
  options = signal([
    { link: '/home', label: 'option.home' },
    { link: '/about', label: 'option.about' },
    { link: '/monitoring', label: 'option.monitoring' },
    { link: '/management', label: 'option.management' },
    { link: '/safety-and-incident-management', label: 'option.safety_and_incident' },
    { link: '/subscriptions', label: 'option.subscriptions' },
    { link: '/feedback-and-tour-reviews/reviews', label: 'option.feedback_and_reviews' }
  ]);
}
