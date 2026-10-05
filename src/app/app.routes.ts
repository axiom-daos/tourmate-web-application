import { Routes } from '@angular/router';
import { Home } from './shared/presentation/views/home/home';

const about = () => import('./shared/presentation/views/about/about').then((m) => m.About);
const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);
const tourMonitoringRoutes = () =>
  import('./tour-monitoring/presentation/tour-monitoring.routes').then(
    (m) => m.tourMonitoringRoutes,
  );
const safetyIncidentRoutes = () =>
  import('./safety-and-incident-management/safety-incident.routes').then(
    (m) => m.safetyIncidentRoutes,
  );
const tourManagementRoutes = () =>
  import('./tour-management/presentation/tour-management.routes').then(
    (m) => m.tourManagementRoutes,
  );
const subscriptionsRoutes = () =>
  import('./subscriptions-and-payment-management/subscriptions.routes').then(
    (m) => m.subscriptionsRoutes,
  );
const feedbackReviewRoutes = () =>
  import('./feedback-and-tour-reviews/feedback-review.routes').then((m) => m.FEEDBACK_REVIEW_ROUTES);

const baseTitle = 'Tour Mate';

export const routes: Routes = [
  { path: 'home', component: Home, title: `${baseTitle} - Home` },
  { path: 'about', loadComponent: about, title: `${baseTitle} - About` },
  { path: 'monitoring', loadChildren: tourMonitoringRoutes },
  { path: 'safety-and-incident-management', loadChildren: safetyIncidentRoutes },
  { path: 'management', loadChildren: tourManagementRoutes },
  {
    path: 'subscriptions',
    loadChildren: subscriptionsRoutes,
    title: `${baseTitle} - Subscriptions & Payments`,
  },
  { path: 'feedback-and-tour-reviews', loadChildren: feedbackReviewRoutes },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Page Not Found` },
];
