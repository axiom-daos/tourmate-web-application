import {Routes} from '@angular/router';

const activeTourList = () => import('./views/active-tour-list/active-tour-list').then(m => m.ActiveTourList);
const activeTourForm = () => import('./views/active-tour-form/active-tour-form').then(m => m.ActiveTourForm);


/**
 * Route tree for learning presentation views.
 */
export const tourMonitoringRoutes: Routes = [
  { path: 'active-tours',              loadComponent: activeTourList },
  { path: 'active-tours/new',          loadComponent: activeTourForm },
  { path: 'active-tours/:id/edit',     loadComponent: activeTourForm },
  { path: '', redirectTo: '/monitoring/active-tours', pathMatch: 'full'}
];
