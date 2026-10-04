import { Component, computed, inject, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslatePipe } from '@ngx-translate/core';
import { SubscriptionStore } from '../../../application/subscription.store';
import { Payment } from '../../../domain/model/payment.entity';

/**
 * Dashboard view for subscription and billing management.
 */
@Component({
  selector: 'app-subscription-dashboard',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    DatePipe,
    LowerCasePipe,
    TranslatePipe,
  ],
  templateUrl: './subscription-dashboard.html',
  styleUrl: './subscription-dashboard.css',
})
export class SubscriptionDashboard {
  readonly store = inject(SubscriptionStore);
  private readonly router = inject(Router);

  readonly displayedColumns: string[] = ['id', 'planId', 'amount', 'requestedAt', 'status'];

  readonly sort = viewChild(MatSort);
  readonly paginator = viewChild(MatPaginator);

  readonly dataSource = computed(() => {
    const source = new MatTableDataSource<Payment>(this.store.currentAgencyPayments());
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
   * Helper to retrieve plan name by ID.
   * @param planId
   */
  getPlanName(planId: number): string {
    const plan = this.store.plans().find((p) => p.id === planId);
    return plan ? plan.name : `Plan #${planId}`;
  }

  /**
   * Navigates to plan selection view.
   */
  navigateToPlans(): void {
    this.router.navigate(['subscriptions/plans']).then();
  }

  /**
   * Cancels active subscription.
   */
  cancelCurrentSubscription(): void {
    if (confirm('Are you sure you want to cancel your current subscription?')) {
      this.store.cancelSubscription();
    }
  }
}
