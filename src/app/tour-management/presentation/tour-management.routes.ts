import {Routes} from '@angular/router';

const tourList = () => import('./views/tour-list/tour-list').then(m => m.TourList)

export const tourManagementRoutes: Routes = [
  { path: 'tours', loadComponent: tourList},
  { path: '', redirectTo: '/management/tours', pathMatch: 'full'}
]
