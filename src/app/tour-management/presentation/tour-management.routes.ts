import {Routes} from '@angular/router';

const tourList = () => import('./views/tour-list/tour-list').then(m => m.TourList)
const tourForm = () => import('./views/tour-form/tour-form').then(m => m.TourForm)
const tourScheduleList = () => import('./views/tour-schedule-list/tour-schedule-list').then(m => m.TourScheduleList)

export const tourManagementRoutes: Routes = [
  { path: 'tours', loadComponent: tourList},
  { path: 'tour-schedules', loadComponent: tourScheduleList},
  { path: 'tours/new', loadComponent: tourForm},
  { path: 'tours/:id/edit', loadComponent: tourForm},
  { path: '', redirectTo: '/management/tours', pathMatch: 'full'}
]
