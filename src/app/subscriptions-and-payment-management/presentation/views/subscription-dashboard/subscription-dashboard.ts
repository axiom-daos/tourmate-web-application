import { Component, computed, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    DatePipe,
    LowerCasePipe,
    TranslatePipe,
    FormsModule,
  ],
  templateUrl: './subscription-dashboard.html',
  styleUrl: './subscription-dashboard.css',
})
export class SubscriptionDashboard {
  readonly store = inject(SubscriptionStore);
  private readonly router = inject(Router);

  readonly displayedColumns: string[] = [
    'id',
    'planId',
    'amount',
    'requestedAt',
    'status',
    'receipt',
  ];

  readonly sort = viewChild(MatSort);
  readonly paginator = viewChild(MatPaginator);

  /**
   * Modal state for subscription cancellation.
   */
  isCancelModalOpen = false;
  selectedCancelReason = 'pause';

  /**
   * Payment receipt modal state.
   */
  selectedPaymentForReceipt: Payment | null = null;

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
   * Opens cancellation confirmation modal.
   */
  openCancelModal(): void {
    this.isCancelModalOpen = true;
    this.selectedCancelReason = 'pause';
  }

  /**
   * Closes cancellation modal.
   */
  closeCancelModal(): void {
    this.isCancelModalOpen = false;
  }

  /**
   * Confirms cancellation with selected reason.
   */
  confirmCancellation(): void {
    this.store.cancelSubscription(this.selectedCancelReason);
    this.closeCancelModal();
  }

  /**
   * Opens the digital receipt modal for a specific payment.
   * @param payment
   */
  openReceipt(payment: Payment): void {
    this.selectedPaymentForReceipt = payment;
  }

  /**
   * Closes the digital receipt modal.
   */
  closeReceipt(): void {
    this.selectedPaymentForReceipt = null;
  }

  /**
   * Triggers the browser print dialog for the receipt.
   */
  printReceipt(): void {
    window.print();
  }

  /**
   * Computes subtotal excluding 18% tax.
   * @param amount
   */
  calculateSubtotal(amount: number): number {
    return Math.round((amount / 1.18) * 100) / 100;
  }

  /**
   * Computes 18% VAT/tax portion.
   * @param amount
   */
  calculateTax(amount: number): number {
    const subtotal = this.calculateSubtotal(amount);
    return Math.round((amount - subtotal) * 100) / 100;
  }
}
