import {Component, computed, input, InputSignal, output, OutputEmitterRef} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {Tour} from '../../../domain/model/tour.entity';
import {MatChip} from '@angular/material/chips';
import {TranslatePipe} from '@ngx-translate/core';
import {MatIcon} from '@angular/material/icon';
import {LowerCasePipe} from '@angular/common';
import {iterator} from 'rxjs/internal/symbol/iterator';
import {MatTooltip} from '@angular/material/tooltip';



@Component({
  imports: [
    MatCardModule,
    MatButtonModule,
    MatChip,
    TranslatePipe,
    MatIcon,
    LowerCasePipe,
    MatTooltip
  ],
  selector: 'app-tour-item',
  styleUrl: './tour-item.css',
  templateUrl: './tour-item.html',
})
export class TourItem {

  readonly difficultyValues: Record<string, number> = {
    EASY: 1,
    MEDIUM: 2,
    HARD: 3
  }

  readonly tour: InputSignal<Tour> = input.required<Tour>()
  readonly imageUrl: InputSignal<string> = input.required<string>()
  readonly difficultyLevel = computed(() => this.difficultyValues[this.tour().details.difficulty] ?? 1)
  editTour: OutputEmitterRef<void> = output<void>()
  deleteTour: OutputEmitterRef<void> = output<void>()
  protected readonly iterator = iterator;
  protected readonly Array = Array;
  protected readonly Tour = Tour;
}
