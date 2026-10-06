import {Component, inject} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TourMonitoringStore} from '../../../application/tour-monitoring.store';
import {ActiveTour} from '../../../domain/model/active-tour.entity';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {TranslatePipe} from '@ngx-translate/core';

/**
 * Creates and edits activeTour entities.
 */
@Component({
  selector: 'app-active-tour-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInput,
    TranslatePipe,
    RouterLink
  ],
  templateUrl: './active-tour-form.html',
  styleUrl: './active-tour-form.css'
})
export class ActiveTourForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(TourMonitoringStore);

  /**
   * Form-group for the activeTour form.
   */
  form = this.fb.group({

    tourScheduleId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    guideId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    status: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    currentLatitude: new FormControl<number | null>(null),
    currentLongitude: new FormControl<number | null>(null),
    startedAt: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    finishedAt: new FormControl<string | null>(null),
  });



  /**
   * Indicates if the form is in edit mode.
   */
  isEdit = false;

  /**
   * The ID of the activeTour being edited, or null for new activeTours.
   */
  activeTourId: number | null = null;

  /**
   * Creates an instance of ActiveTourForm and initializes the form based on route parameters.
   */
  constructor() {
    this.route.params.subscribe(params => {
      this.activeTourId = params['id'] ? +params['id'] : null;
      this.isEdit = !!this.activeTourId;
      if (this.isEdit && this.activeTourId) {
        const id = this.activeTourId;
        const activeTour = this.store.getActiveTourById(id)();
        if (activeTour) {
          this.form.patchValue({
            tourScheduleId: activeTour.tourScheduleId,
            guideId: activeTour.guideId,
            status: activeTour.status,
            currentLatitude: activeTour.currentLatitude,
            currentLongitude: activeTour.currentLongitude,
            startedAt: activeTour.startedAt,
            finishedAt: activeTour.finishedAt,
          });
        }
      }
    });
  }

  /**
   * Submits the form to create or update the activeTour.
   */

  submit() {
    if (this.form.invalid) return;
    const activeTour: ActiveTour = new ActiveTour({
      id: this.activeTourId ?? 0,
      tourScheduleId: this.form.value.tourScheduleId!,
      guideId: this.form.value.guideId!,
      status: this.form.value.status!,
      currentLatitude: this.form.value.currentLatitude!,
      currentLongitude: this.form.value.currentLongitude!,
      startedAt: this.form.value.startedAt!,
      finishedAt: this.form.value.finishedAt ?? ''

    });

    if (this.isEdit) {
      this.store.updateActiveTour(activeTour);
    } else {
      this.store.addActiveTour(activeTour);
    }

    this.router.navigate(['/monitoring/active-tours']).then();
  }

}
