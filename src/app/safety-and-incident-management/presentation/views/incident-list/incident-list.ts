import { Component, computed, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, LowerCasePipe, NgIf } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { IncidentStore } from '../../../application/incident.store';
import { Incident } from '../../../domain/model/aggregates/incident.entity';

/**
 * Displays the incident collection with table actions.
 */
@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    DatePipe,
    LowerCasePipe,
    TranslatePipe,
  ],
  templateUrl: './incident-list.html',
  styleUrl: './incident-list.css',
})
export class IncidentList {
  readonly store = inject(IncidentStore);
  protected router = inject(Router);

  displayedColumns: string[] = [
    'id',
    'activeTourId',
    'reportedByUserId',
    'description',
    'reportedAt',
    'status',
    'actions',
  ];

  readonly sort = viewChild(MatSort);
  readonly paginator = viewChild(MatPaginator);

  readonly dataSource = computed(() => {
    const source = new MatTableDataSource(this.store.incidents());
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

  editIncident(id: number) {
    this.router.navigate([`safety-and-incident-management/incidents/${id}/edit`]).then();
  }

  resolveIncident(incident: Incident) {
    this.store.resolveIncident(incident);
  }

  deleteIncident(id: number) {
    this.store.deleteIncident(id);
  }

  navigateToNew() {
    this.router.navigate(['safety-and-incident-management/incidents/new-incident']).then();
  }
}
