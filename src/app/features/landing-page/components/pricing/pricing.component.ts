import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../section-title/section-title.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { PublicSubscriptionPlan, SubscriptionPlanService } from '../../../../core/services/subscription-plan.service';
import { APP_LIMITS } from '../../../../core/constants/app.constants';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent, ButtonComponent],
  templateUrl: './pricing.component.html'
})
export class PricingComponent implements OnInit {
  readonly maxSubscriptionPlans = APP_LIMITS.MAX_SUBSCRIPTION_PLANS;
  loading = true;
  error: string | null = null;
  plans: PublicSubscriptionPlan[] = [];

  constructor(
    private router: Router,
    private subscriptionPlanService: SubscriptionPlanService,
    private animationService: AnimationService,
  ) {}

  ngOnInit(): void {
    this.subscriptionPlanService.getPublicPlans().subscribe({
      next: (plans) => {
        this.plans = [...plans].sort(
          (left, right) => (left.pricePerMonth ?? 0) - (right.pricePerMonth ?? 0)
        );
        this.loading = false;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.animationService.initScrollAnimations();
          });
        });
      },
      error: (error) => {
        console.error('Failed to load public pricing plans', error);
        this.error = 'Pricing is unavailable right now.';
        this.loading = false;
      },
    });
  }

  isHighlighted(plan: PublicSubscriptionPlan, index: number): boolean {
    if (plan.code === 'pro-monthly') {
      return true;
    }
    return this.plans.length >= this.maxSubscriptionPlans && index === 1;
  }

  getPriceLabel(plan: PublicSubscriptionPlan): string {
    if ((plan.pricePerMonth ?? 0) <= 0) {
      return 'Free';
    }
    return `$${plan.pricePerMonth}`;
  }

  getCycleLabel(plan: PublicSubscriptionPlan): string {
    switch (plan.billingCycle) {
      case 'yearly':
        return '/yr';
      case 'quarterly':
        return '/qtr';
      default:
        return '/mo';
    }
  }

  getDisplayFeatures(plan: PublicSubscriptionPlan): string[] {
    const features = plan.features || [];
    return features.filter((feature) => {
      const normalized = feature.toLowerCase();
      return !(
        normalized.includes('student') ||
        normalized.includes('teacher') ||
        normalized.includes('course') ||
        normalized.includes('storage')
      );
    });
  }

  navigateToAdminSignup() {
    this.router.navigate(['/signup/admin']);
  }
}
