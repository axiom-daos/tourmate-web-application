import {Routes} from '@angular/router';

const activeTourList = () => import('./views/active-tour-list/active-tour-list').then(m => m.ActiveTourList);
const activeTourForm = () => import('./views/active-tour-form/active-tour-form').then(m => m.ActiveTourForm);
const liveMonitoring = () => import('./views/live-monitoring/live-monitoring').then(m => m.LiveMonitoring);


/**
 * Route tree for learning presentation views.
 */
export const tourMonitoringRoutes: Routes = [
  { path: 'live', loadComponent: liveMonitoring, title: 'TourMate - Live monitoring' },
  { path: 'live/:id', loadComponent: liveMonitoring, title: 'TourMate - Live monitoring' },
  { path: 'active-tours',              loadComponent: activeTourList },
  { path: 'active-tours/new',          loadComponent: activeTourForm },
  { path: 'active-tours/:id/edit',     loadComponent: activeTourForm },
  { path: '', redirectTo: '/monitoring/active-tours', pathMatch: 'full'},
];
