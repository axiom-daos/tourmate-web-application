import {Component, computed, inject, viewChild} from '@angular/core';
import {TourMonitoringStore} from '../../../application/tour-monitoring.store';
import {Router} from '@angular/router';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {TranslatePipe} from '@ngx-translate/core';
import {MatIcon} from '@angular/material/icon';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

/**
 * Displays the activeTour collection with table actions.
 */
@Component({
  selector: 'app-active-tour-list',
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
    MatPaginator
  ],
  templateUrl: './active-tour-list.html',
  styleUrl: './active-tour-list.css'
})
export class ActiveTourList {
  readonly store = inject(TourMonitoringStore);
  protected router = inject(Router);

  /**
   * Columns to display in the table.
   */
  displayedColumns: string[] = ['id', 'tourScheduleId', 'tourScheduleIdMaxCapacity', 'status', 'actions'];

  readonly sort = viewChild(MatSort);
  readonly paginator = viewChild(MatPaginator);

  /**
   * Computed data source for the table.
   */
  readonly dataSource = computed(() => {
    const source = new MatTableDataSource(this.store.activeTours());
    const sort = this.sort();
    if (sort) {
      source.sort = sort;
    }
    const paginator = this.paginator();
    if (paginator) {
      source.paginator = paginator;
    }
    return source;
  });

  /**
   * Navigates to the edit page for a activeTour.
   * @param id - The ID of the activeTour to edit.
   */
  editActiveTour(id: number) {
    this.router.navigate(['monitoring/active-tours', id, 'edit']).then();
  }

  /**
   * Deletes a activeTour by ID.
   * @param id - The ID of the activeTour to delete.
   */
  deleteActiveTour(id: number) {
    this.store.deleteActiveTour(id);
  }

  /**
   * Navigates to the new activeTour form.
   */
  navigateToNew() {
    this.router.navigate(['monitoring/active-tours/new']).then();
  }
  navigateToLive(id: number) {
    this.router.navigate(['monitoring/live', id]).then();
  }
}
