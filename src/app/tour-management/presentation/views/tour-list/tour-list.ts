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
    MatPaginator
  ],
  selector: 'app-tour-list',
  styleUrl: './tour-list.css',
  templateUrl: './tour-list.html',
})
export class TourList {

  protected readonly store: TourManagementStore = inject(TourManagementStore)
  #router: Router = inject(Router)


  protected readonly displayedColumns: string[] = ['id', 'agencyId', 'title', 'description', 'duration', 'difficulty', 'price', 'status', 'actions']

  protected readonly sort: Signal<MatSort | undefined> = viewChild(MatSort)
  protected readonly paginator: Signal<MatPaginator | undefined> = viewChild(MatPaginator)

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
