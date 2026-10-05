import {Component, input, InputSignal, output, Output, OutputEmitterRef} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {Tour} from '../../../domain/model/tour.entity';
import {MatChip} from '@angular/material/chips';
import {TranslatePipe} from '@ngx-translate/core';
import {MatCell} from '@angular/material/table';
import {MatIcon} from '@angular/material/icon';
import {LowerCasePipe} from '@angular/common';

@Component({
  imports: [
    MatCardModule,
    MatButtonModule,
    MatChip,
    TranslatePipe,
    MatCell,
    MatIcon,
    LowerCasePipe
  ],
  selector: 'app-tour-item',
  styleUrl: './tour-item.css',
  templateUrl: './tour-item.html',
})
export class TourItem {

  tour: InputSignal<Tour> = input.required<Tour>()
  editTour: OutputEmitterRef<void> = output<void>()
  deleteTour: OutputEmitterRef<void> = output<void>()
}
