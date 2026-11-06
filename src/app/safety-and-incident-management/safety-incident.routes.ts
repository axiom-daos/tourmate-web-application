import { Routes } from '@angular/router';

const incidentList = () =>
  import('./presentation/views/incident-list/incident-list').then((m) => m.IncidentList);
const incidentForm = () =>
  import('./presentation/views/incident-form/incident-form').then((m) => m.IncidentForm);
const safetyDashboard = () =>
  import('./presentation/views/safety-dashboard/safety-dashboard').then(
    (m) => m.SafetyDashboard,
  );

/**
 * Route tree for safety and incident management presentation views.
 */
export const safetyIncidentRoutes: Routes = [
  { path: 'dashboard', loadComponent: safetyDashboard },
  { path: 'incidents', loadComponent: incidentList },
  { path: 'incidents/new', loadComponent: incidentForm },
  { path: 'incidents/new-incident', loadComponent: incidentForm },
  { path: 'incidents/:id/edit', loadComponent: incidentForm },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
