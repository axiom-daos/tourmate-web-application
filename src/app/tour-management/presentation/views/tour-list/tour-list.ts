import {Component, computed, inject, Signal, viewChild} from '@angular/core';
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
import {TourManagementStore} from '../../../application/tour-management-store';
import {Router} from '@angular/router';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';


@Component({
  imports: [
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
  selector: 'app-tour-list',
  styleUrl: './tour-list.css',
  templateUrl: './tour-list.html',
})
export class TourList {

  protected readonly store: TourManagementStore = inject(TourManagementStore)
  #router: Router = inject(Router)


  protected readonly displayedColumns: string[] = ['id', 'agencyId', 'title', 'description', 'duration', 'difficulty', 'price', 'status', 'actions']
  protected readonly currentView = 'tours'

  protected readonly sort: Signal<MatSort | undefined> = viewChild(MatSort)
  protected readonly paginator: Signal<MatPaginator | undefined> = viewChild(MatPaginator)

  protected onViewChange(view: string): void {
    if (view === 'tour-schedules') {
      this.#router.navigate(['/management/tour-schedules']).then()
    }
  }

  protected readonly dataSource = computed(() => {
    const source = new MatTableDataSource(this.store.tours())

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

  protected navigateToNew() {
    this.#router.navigate(['management/tours/new']).then()
  }

  protected editTour(id: number) {
    this.#router.navigate(['management/tours', id, 'edit']).then()
  }

  protected deleteTour(id: number) {
    this.store.deleteTour(id)
  }



}
