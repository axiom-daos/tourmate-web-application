import {Component, inject} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {TranslatePipe} from '@ngx-translate/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TourManagementStore} from '../../../application/tour-management-store';
import {TourSchedule} from '../../../domain/model/tour-schedule.entity';

@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInput,
    TranslatePipe,
    RouterLink
  ],
  selector: 'app-tour-schedule-form',
  styleUrl: './tour-schedule-form.css',
  templateUrl: './tour-schedule-form.html',
})
export class TourScheduleForm {

  #fb: FormBuilder = inject(FormBuilder)
  #route: ActivatedRoute = inject(ActivatedRoute)
  #router: Router = inject(Router)
  #store: TourManagementStore = inject(TourManagementStore)

  protected form = this.#fb.group({
    tourId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    departureDateTime: new FormControl<string>('', { nonNullable: true, validators: [Validators.required]}),
    maxCapacity: new FormControl<number | null>(null, { validators: [Validators.required] }),
    status: new FormControl<string>('', { nonNullable: true, validators: [Validators.required]}),
  })

  protected isEdit: boolean = false
  protected tourScheduleId: number | null = null

  protected status: string[] = ['OPENED','CLOSED']


  constructor() {

    this.#route.params.subscribe(params => {
      this.tourScheduleId = params['id'] ? +params['id'] : null
      this.isEdit = !!this.tourScheduleId

      if(this.isEdit && this.tourScheduleId) {

        const id = this.tourScheduleId
        const tourSchedule = this.#store.getTourScheduleById(id)()

        if(tourSchedule) {
          this.form.patchValue({
            tourId: tourSchedule.tourId,
            departureDateTime: tourSchedule.departureDateTime,
            maxCapacity: tourSchedule.maxCapacity,
            status: tourSchedule.status
          })
        }
      }
    })
  }

  protected submit(): void  {
    if (this.form.invalid) return;

    let formattedDateTime = this.form.value.departureDateTime
    if(formattedDateTime && formattedDateTime.length === 16) {
      formattedDateTime += ':00'
    }

    const tourSchedule = new TourSchedule({
      id: this.tourScheduleId ?? 0,
      tourId: this.form.value.tourId!,
      departureDateTime: formattedDateTime!,
      maxCapacity: this.form.value.maxCapacity!,
      status: this.form.value.status!
    })

    if(this.isEdit) {
      this.#store.updateTourSchedule(tourSchedule)
    }else {
      this.#store.addTourSchedule(tourSchedule)
    }

    this.#router.navigate(['/management/tour-schedules']).then()
  }

}
