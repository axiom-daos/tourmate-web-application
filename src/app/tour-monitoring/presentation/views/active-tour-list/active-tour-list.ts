import {Component, computed, inject, signal} from '@angular/core';
import {TourMonitoringStore} from '../../../application/tour-monitoring.store';
import {Router} from '@angular/router';
import {ActiveTour} from '../../../domain/model/active-tour.entity';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {MatIconModule} from '@angular/material/icon';

/**
 * Displays the active tour collection as responsive cards.
 */
@Component({
  selector: 'app-active-tour-list',
  imports: [
    MatCardModule,
    MatButton,
    MatIconModule,
    MatIconButton,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './active-tour-list.html',
  styleUrl: './active-tour-list.css'
})
export class ActiveTourList {
  readonly store = inject(TourMonitoringStore);
  protected router = inject(Router);
  private readonly translate = inject(TranslateService);

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(6);
  protected readonly sortBy = signal<'id' | 'title' | 'capacity'>('id');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');

  protected readonly sortedTours = computed(() => {
    const tours = [...this.store.activeTours()];
    const sortBy = this.sortBy();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return tours.sort((left, right) => {
      let comparison = 0;
      if (sortBy === 'title') {
        const leftTitle = left.tourSchedule?.tour?.details.title ?? '';
        const rightTitle = right.tourSchedule?.tour?.details.title ?? '';
        comparison = leftTitle.localeCompare(rightTitle);
      } else if (sortBy === 'capacity') {
        comparison = (left.tourSchedule?.maxCapacity ?? 0) - (right.tourSchedule?.maxCapacity ?? 0);
      } else {
        comparison = left.id - right.id;
      }
      return comparison * direction;
    });
  });

  protected readonly visibleTours = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sortedTours().slice(start, start + this.pageSize());
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
    const confirmation = this.translate.instant('activeTours.delete_confirm');
    if (window.confirm(confirmation)) {
      this.store.deleteActiveTour(id);
    }
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

  protected changeSort(event: Event): void {
    const select = event.target;
    if (select instanceof HTMLSelectElement) {
      const value = select.value;
      if (value === 'id' || value === 'title' || value === 'capacity') {
        this.sortBy.set(value);
        this.pageIndex.set(0);
      }
    }
  }

  protected toggleSortDirection(): void {
    this.sortDirection.update(direction => direction === 'asc' ? 'desc' : 'asc');
    this.pageIndex.set(0);
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  protected guideName(activeTour: ActiveTour): string {
    const user = activeTour.guide?.user;
    return user ? `${user.firstName} ${user.lastName}` : '—';
  }

  protected guideInitial(activeTour: ActiveTour): string {
    return activeTour.guide?.user?.firstName?.charAt(0)?.toUpperCase() ?? 'G';
  }
}
