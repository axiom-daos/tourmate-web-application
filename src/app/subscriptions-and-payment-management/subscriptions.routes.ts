import { Routes } from '@angular/router';

const subscriptionDashboard = () =>
  import('./presentation/views/subscription-dashboard/subscription-dashboard').then(
    (m) => m.SubscriptionDashboard,
  );

const planSelection = () =>
  import('./presentation/views/plan-selection/plan-selection').then((m) => m.PlanSelection);

/**
 * Route tree for subscriptions and payment management views.
 */
export const subscriptionsRoutes: Routes = [
  { path: 'dashboard', loadComponent: subscriptionDashboard },
  { path: 'plans', loadComponent: planSelection },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
