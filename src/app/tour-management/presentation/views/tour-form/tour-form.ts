import {Component, inject} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {TranslatePipe} from '@ngx-translate/core';
import {ActivatedRoute, Route, Router, Routes} from '@angular/router';
import {TourManagementStore} from '../../../application/tour-management-store';
import {Tour} from '../../../domain/model/tour.entity';
import {TourDetails} from '../../../domain/model/tour-details.entity';
import {Price} from '../../../domain/model/price.entity';

@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInput,
    TranslatePipe
  ],
  selector: 'app-tour-form',
  styleUrl: './tour-form.css',
  templateUrl: './tour-form.html',
})
export class TourForm {

  #fb: FormBuilder = inject(FormBuilder)
  #route: ActivatedRoute = inject(ActivatedRoute)
  #router: Router = inject(Router)
  #store: TourManagementStore = inject(TourManagementStore)

  protected form = this.#fb.group({
    agencyId: new FormControl<number | null>(null),
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required]}),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required]}),
    duration: new FormControl<string>('', { nonNullable: true, validators: [Validators.required]}),
    difficulty: new FormControl<string>('', { nonNullable: true, validators: [Validators.required]}),
    priceAmount: new FormControl<number | null>(null),
    priceCurrency: new FormControl<string>('', { nonNullable: true, validators: [Validators.required]}),
    status: new FormControl<string>('', { nonNullable: true, validators: [Validators.required]}),
  })

  protected isEdit: boolean = false
  protected tourId: number | null = null

  protected readonly currencies = ['USD', 'PEN']
  protected readonly difficulties = ['EASY', 'MEDIUM', 'HARD']
  protected readonly status = ['PUBLISHED','UNAVAILABLE']

  constructor() {
    this.#route.params.subscribe(params => {
      this.tourId = params['id'] ? +params['id'] : null
      this.isEdit = !!this.tourId

      if(this.isEdit && this.tourId) {
        const id = this.tourId
        const tour = this.#store.getTourById(id)()

        if(tour) {
          this.form.patchValue({
            agencyId: tour.agencyId,
            title: tour.details.title,
            description: tour.details.description,
            duration: tour.details.duration,
            difficulty: tour.details.difficulty,
            priceAmount: tour.details.price.amount,
            priceCurrency: tour.details.price.currency,
            status: tour.status
          })
        }
      }
    })
  }

  protected submit() {
    if(this.form.invalid) return


    const tour: Tour = new Tour({
      id: this.tourId ?? 0,
      agencyId: this.form.value.agencyId!,
      details: new TourDetails({
        title: this.form.value.title!,
        description: this.form.value.description!,
        duration: this.form.value.duration!,
        difficulty: this.form.value.difficulty!,
        price: new Price({
          amount: this.form.value.priceAmount!,
          currency: this.form.value.priceCurrency!
        })
      }),
      status: this.form.value.status!
    })

    if(this.isEdit) {
      this.#store.updateTour(tour)
    } else {
      this.#store.addTour(tour)
    }

    this.#router.navigate(['management/tours']).then()
  }

}
