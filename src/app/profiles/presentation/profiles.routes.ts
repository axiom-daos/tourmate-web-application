import { Routes } from '@angular/router';
import { ProfileView } from './views/profile-view/profile-view';

const profileTours = () =>
  import('./views/profile-tours/profile-tours').then((module) => module.ProfileTours);

export const profilesRoutes: Routes = [
  { path: '', component: ProfileView, pathMatch: 'full' },
  { path: ':id/tours', loadComponent: profileTours },
];
