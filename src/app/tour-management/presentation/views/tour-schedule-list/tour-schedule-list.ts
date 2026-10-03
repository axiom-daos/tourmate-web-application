import {Component, computed, inject, Signal, viewChild} from '@angular/core';
import {MatError} from '@angular/material/input';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef,
  MatTable, MatTableDataSource
} from '@angular/material/table';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {TranslatePipe} from '@ngx-translate/core';
import {MatIcon} from '@angular/material/icon';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {TourManagementStore} from '../../../application/tour-management-store';
import {Router} from '@angular/router';

@Component({
  imports: [
    MatError,
    MatTable,
    MatHeaderCellDef,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRowDef,
    MatRowDef,
    MatButton,
    MatHeaderRow,
    MatRow,
    MatProgressSpinner,
    TranslatePipe,
    MatIcon,
    MatIconButton,
    MatSort,
    MatSortHeader,
    MatPaginator,
    MatButtonToggleGroup,
    MatButtonToggle
  ],
  selector: 'app-tour-schedule-list',
  styleUrl: './tour-schedule-list.css',
  templateUrl: './tour-schedule-list.html',
})
export class TourScheduleList {

  protected readonly store: TourManagementStore = inject(TourManagementStore)
  #router: Router = inject(Router)

  protected readonly displayedColumns: string[] = ['id', 'tourId', 'departureDateTime', 'maxCapacity', 'status','actions']
  protected readonly currentView = 'tour-schedules'

  protected readonly sort: Signal<MatSort | undefined> = viewChild(MatSort)
  protected readonly paginator: Signal<MatPaginator | undefined> = viewChild(MatPaginator)

  protected onViewChange(view: string): void {
    if(view === 'tours') {
      this.#router.navigate(['/management/tours']).then()
    }
  }

  protected readonly dataSource = computed(() => {
    const source = new MatTableDataSource(this.store.tourSchedules())

    const sort = this.sort()
    if(sort) {
      source.sort = sort
    }

    const paginator = this.paginator()
    if(paginator) {
      source.paginator = paginator
    }

    return source
  })

  protected navigateToNew(): void {
    this.#router.navigate(['/management/tour-schedules/new']).then()
  }

  protected editTourSchedule(id: number): void {
    this.#router.navigate(['/management/tour-schedules', id, 'edit']).then()
  }

  protected deleteTourSchedule(id: number): void {
    this.store.deleteTour(id)
  }
}
