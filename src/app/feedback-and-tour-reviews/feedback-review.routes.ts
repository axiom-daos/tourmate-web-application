import { Routes } from '@angular/router';
import { ReviewList } from './presentation/views/review-list/review-list';
import { ReviewForm } from './presentation/views/review-form/review-form';

export const FEEDBACK_REVIEW_ROUTES: Routes = [
  { path: 'reviews', component: ReviewList },
  { path: 'reviews/new', component: ReviewForm },
  { path: 'reviews/edit/:id', component: ReviewForm }
];
