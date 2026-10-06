import {Component, computed, effect, inject} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TourMonitoringStore} from '../../../application/tour-monitoring.store';
import {ActiveTour} from '../../../domain/model/active-tour.entity';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-active-tour-form',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatFormFieldModule,
    MatButtonModule,
    MatInput,
    MatSelectModule,
    TranslatePipe,
    RouterLink,
  ],
  templateUrl: './active-tour-form.html',
  styleUrl: './active-tour-form.css',
})
export class ActiveTourForm {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly store = inject(TourMonitoringStore);

  protected readonly scheduleOptions = computed(() =>
    this.store.tourSchedules().map(schedule => ({
      schedule,
      tourTitle: schedule.tour?.details.title ?? `#${schedule.tourId}`,
    })),
  );

  protected readonly form = this.fb.group({
    tourScheduleId: new FormControl<number | null>(null, {validators: [Validators.required]}),
    guideId: new FormControl<number | null>(null, {validators: [Validators.required]}),
    status: new FormControl<string>('IN_PROGRESS', {nonNullable: true, validators: [Validators.required]}),
    currentLatitude: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(-90), Validators.max(90)],
    }),
    currentLongitude: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(-180), Validators.max(180)],
    }),
    startedAt: new FormControl<string>(this.toLocalDateTime(new Date()), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    finishedAt: new FormControl<string | null>(null),
  });

  protected isEdit = false;
  private activeTourId: number | null = null;

  constructor() {
    effect(() => {
      if (this.isEdit || this.form.controls.tourScheduleId.value !== null) return;

      const schedules = this.store.tourSchedules();
      const initialSchedule =
        schedules.find(schedule => schedule.status === 'SCHEDULED' || schedule.status === 'IN_PROGRESS') ??
        schedules[0];
      if (!initialSchedule) return;

      this.form.controls.tourScheduleId.setValue(initialSchedule.id);
      this.store.loadScheduleStartCoordinates(initialSchedule.id);
    });

    effect(() => {
      const coordinates = this.store.scheduleStartCoordinates();
      if (!coordinates || this.isEdit) return;

      this.form.patchValue({
        currentLatitude: coordinates.latitude,
        currentLongitude: coordinates.longitude,
      });
    });

    this.route.params.subscribe(params => {
      this.activeTourId = params['id'] ? Number(params['id']) : null;
      this.isEdit = this.activeTourId !== null;
      if (!this.activeTourId) return;

      const activeTour = this.store.getActiveTourById(this.activeTourId)();
      if (!activeTour) return;

      this.form.patchValue({
        tourScheduleId: activeTour.tourScheduleId,
        guideId: activeTour.guideId,
        status: activeTour.status,
        currentLatitude: activeTour.currentLatitude,
        currentLongitude: activeTour.currentLongitude,
        startedAt: this.toLocalDateTime(new Date(activeTour.startedAt)),
        finishedAt: activeTour.finishedAt
          ? this.toLocalDateTime(new Date(activeTour.finishedAt))
          : null,
      });
    });
  }

  protected onScheduleChange(scheduleId: number): void {
    if (!this.isEdit) {
      this.form.controls.currentLatitude.reset(null);
      this.form.controls.currentLongitude.reset(null);
      this.store.loadScheduleStartCoordinates(scheduleId);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const activeTour = new ActiveTour({
      id: this.activeTourId ?? 0,
      tourScheduleId: values.tourScheduleId!,
      guideId: values.guideId!,
      status: values.status,
      currentLatitude: values.currentLatitude!,
      currentLongitude: values.currentLongitude!,
      startedAt: new Date(values.startedAt).toISOString(),
      finishedAt: values.finishedAt ? new Date(values.finishedAt).toISOString() : '',
    });

    if (this.isEdit) {
      this.store.updateActiveTour(activeTour);
    } else {
      this.store.addActiveTour(activeTour);
    }

    this.router.navigate(['/monitoring/active-tours']).then();
  }

  private toLocalDateTime(date: Date): string {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  }
}
