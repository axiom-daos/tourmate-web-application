import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { SubscriptionStore } from '../../../application/subscription.store';
import { Plan } from '../../../domain/model/plan.entity';

/**
 * View allowing agencies to compare and select subscription plans.
 */
@Component({
  selector: 'app-plan-selection',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './plan-selection.html',
  styleUrl: './plan-selection.css',
})
export class PlanSelection {
  readonly store = inject(SubscriptionStore);
  private readonly router = inject(Router);

  /**
   * Plan currently selected for confirmation in the checkout modal.
   */
  selectedPlanForCheckout: Plan | null = null;

  /**
   * Feature set per tier using i18n keys aligned with TourMate specification.
   */
  private readonly planFeatureSets: Record<number, string[]> = {
    1: [
      'subscription.features_tier_1_1',
      'subscription.features_tier_1_2',
      'subscription.features_tier_1_3',
      'subscription.features_tier_1_4',
    ],
    2: [
      'subscription.features_tier_2_1',
      'subscription.features_tier_2_2',
      'subscription.features_tier_2_3',
      'subscription.features_tier_2_4',
      'subscription.features_tier_2_5',
    ],
    3: [
      'subscription.features_tier_3_1',
      'subscription.features_tier_3_2',
      'subscription.features_tier_3_3',
      'subscription.features_tier_3_4',
      'subscription.features_tier_3_5',
    ],
  };

  /**
   * Returns feature list for a plan.
   * @param planId
   */
  getFeaturesForPlan(planId: number): string[] {
    return (
      this.planFeatureSets[planId] || [
        'subscription.features_tier_1_1',
        'subscription.features_tier_1_2',
        'subscription.features_tier_1_3',
      ]
    );
  }

  /**
   * Checks whether the given plan is currently active.
   * @param planId
   */
  isCurrentPlan(planId: number): boolean {
    const current = this.store.currentSubscription();
    return current?.planId === planId && current?.status === 'ACTIVE';
  }

  /**
   * Opens the checkout confirmation modal for the chosen plan.
   * @param plan
   */
  openCheckout(plan: Plan): void {
    this.selectedPlanForCheckout = plan;
  }

  /**
   * Closes the checkout modal.
   */
  closeCheckout(): void {
    this.selectedPlanForCheckout = null;
  }

  /**
   * Confirms the checkout and activates the chosen plan.
   */
  confirmCheckout(): void {
    if (!this.selectedPlanForCheckout) return;
    const plan = this.selectedPlanForCheckout;
    this.selectedPlanForCheckout = null;
    this.store.subscribeToPlan(plan);
    this.router.navigate(['subscriptions/dashboard']).then();
  }

  /**
   * Navigates back to dashboard.
   */
  goBack(): void {
    this.router.navigate(['subscriptions/dashboard']).then();
  }
}
