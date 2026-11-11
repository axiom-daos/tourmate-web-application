import { Routes } from '@angular/router';

import { ReviewList } from './presentation/views/review-list/review-list';
import { ReviewForm } from './presentation/views/review-form/review-form';

/**
 * Configuración de rutas del Bounded Context
 * Feedback and Tour Reviews.
 *
 * Permite listar, crear y editar reseñas.
 */
export const FEEDBACK_REVIEW_ROUTES: Routes = [
  // Muestra todas las reseñas registradas.
  {
    path: 'reviews',
    component: ReviewList,
  },

  // Muestra el formulario para crear una reseña.
  {
    path: 'reviews/new',
    component: ReviewForm,
  },

  // Muestra el formulario para editar una reseña.
  // El parámetro id identifica la reseña.
  {
    path: 'reviews/edit/:id',
    component: ReviewForm,
  },

  // Redirige a la lista cuando se ingresa
  // a la raíz de este Bounded Context.
  {
    path: '',
    redirectTo: 'reviews',
    pathMatch: 'full',
  },
];
