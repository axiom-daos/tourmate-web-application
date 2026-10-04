import {Component, signal} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {TranslatePipe} from '@ngx-translate/core';
import {LanguageSwitcher} from '../language-switcher/language-switcher';
import {FooterContent} from '../footer-content/footer-content';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
/*
import {
  AuthenticationSection
} from '../../../../iam/presentation/components/authentication-section/authentication-section';
*/

/**
 * Main shell component that hosts top-level navigation and routed content.
 */
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
    // AuthenticationSection
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  /**
   * Array of navigation options for the application's menu.
   */
  options = signal([
    {link: '/home', label: 'option.home'},
    {link: '/about', label: 'option.about'},
    {link: '/tourmate/monitoring', label: 'option.monitoring'},
    {link: '/management', label: 'option.management'},
    {link: '/safety-and-incident-management', label: 'option.safety_and_incident'}
  ]);
}
