import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
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
    MatFormFieldModule,
    TranslatePipe,
  ],
  templateUrl: './plan-selection.html',
  styleUrl: './plan-selection.css',
})
export class PlanSelection {
  readonly store = inject(SubscriptionStore);
  private readonly router = inject(Router);

  /**
   * Mocked feature set per tier aligned with TourMate specification.
   */
  private readonly planFeatureSets: Record<number, string[]> = {
    1: [
      'Up to 5 active tours simultaneously',
      'Basic GPS route monitoring',
      'Incident reporting & logging',
      'Standard email support',
    ],
    2: [
      'Up to 25 active tours simultaneously',
      'Real-time biometric & IoT telemetry',
      'Automated health anomaly alerts',
      'Offline map synchronization',
      'Priority 24/7 technical support',
    ],
    3: [
      'Unlimited active tours & guides',
      'Dedicated satellite dispatch & SOS link',
      'Custom expedition analytics & reports',
      'Multi-agency team management',
      'Dedicated customer success manager',
    ],
  };

  /**
   * Returns feature list for a plan.
   * @param planId
   */
  getFeaturesForPlan(planId: number): string[] {
    return (
      this.planFeatureSets[planId] || [
        'Standard tour management',
        'Real-time tracking',
        'Security alerts',
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
   * Upgrades or subscribes to the selected plan.
   * @param plan
   */
  selectPlan(plan: Plan): void {
    if (
      confirm(
        `Do you want to activate the "${plan.name}" plan for $${plan.priceAmount} ${plan.priceCurrency}/mo?`,
      )
    ) {
      this.store.subscribeToPlan(plan);
      this.router.navigate(['subscriptions/dashboard']).then();
    }
  }

  /**
   * Navigates back to dashboard.
   */
  goBack(): void {
    this.router.navigate(['subscriptions/dashboard']).then();
  }
}
