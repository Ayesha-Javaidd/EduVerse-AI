import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, BillingPlan, BillingUsage } from '../../../../core/services/admin.service';
import { HttpClientModule } from '@angular/common/http';
import { StripeEmbeddedModalComponent } from '../../../../shared/components/stripe-embedded-modal/stripe-embedded-modal.component';

@Component({
  selector: 'app-admin-billing',
  standalone: true,
  imports: [CommonModule, HttpClientModule, StripeEmbeddedModalComponent],
  templateUrl: './admin-billing.component.html',
  styleUrls: ['./admin-billing.component.css']
})
export class AdminBillingComponent implements OnInit, OnChanges {
  @Input() initialSuccessMessage: string | null = null;
  @Input() sessionId: string | null = null;

  loading = true;
  usageData: BillingUsage | null = null;
  availablePlans: BillingPlan[] = [];
  
  // Modal state
  showPaymentModal: boolean = false;
  selectedPlan: BillingPlan | null = null;
  clientSecret: string = '';
  
  checkoutLoadingId: string | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.applyInitialSuccessMessage();
    if (this.sessionId) {
      // Session ID is already available on init (component is inside *ngIf='billing')
      console.log('[AdminBilling] Verifying session on init:', this.sessionId);
      this.verifySession(this.sessionId);
    } else {
      this.fetchBillingData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialSuccessMessage']) {
      this.applyInitialSuccessMessage();
    }
    // Handles the rare case where sessionId arrives after init
    if (changes['sessionId'] && this.sessionId && !changes['sessionId'].firstChange) {
      this.verifySession(this.sessionId);
    }
  }

  private verifySession(sessionId: string): void {
    this.loading = true;
    this.adminService.verifySubscriptionCheckout(sessionId).subscribe({
      next: (res) => {
        console.log('[AdminBilling] Verify response:', res);
        if (res.success) {
          this.showSuccess(res.message || 'Subscription upgraded successfully!');
        } else {
          this.showError(res.message || 'Failed to verify subscription.');
        }
        this.fetchBillingData();
      },
      error: (err) => {
        console.error('[AdminBilling] Verify error:', err);
        this.showError('Failed to verify checkout session. Please refresh.');
        this.fetchBillingData();
      }
    });
  }

  fetchBillingData(): void {
    this.adminService.getBillingUsage().subscribe({
      next: (data) => {
        this.usageData = data;
        this.fetchPlans();
      },
      error: (err) => {
        console.error('Failed to load billing usage', err);
        this.loading = false;
      }
    });
  }

  fetchPlans(): void {
    this.adminService.getAvailablePlans().subscribe({
      next: (plans) => {
        this.availablePlans = [...plans].sort(
          (left, right) => (left.pricePerMonth ?? 0) - (right.pricePerMonth ?? 0)
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load available plans', err);
        this.loading = false;
      }
    });
  }

  getUsagePercentage(used: number | undefined, max: number | undefined): number {
    if (used === undefined) used = 0;
    if (max === undefined || max <= 0 || max === null) return 0; // Unlimited
    const percent = (used / max) * 100;
    return percent > 100 ? 100 : percent;
  }

  isUnlimited(val: number | undefined | null): boolean {
    return val === -1 || val === null || val === undefined;
  }

  getPriceLabel(plan: BillingPlan): string {
    if ((plan.pricePerMonth ?? 0) <= 0) {
      return 'Free';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: plan.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(plan.pricePerMonth);
  }

  getCycleLabel(plan: BillingPlan): string {
    switch (plan.billingCycle) {
      case 'yearly':
        return '/yr';
      case 'quarterly':
        return '/qtr';
      default:
        return '/mo';
    }
  }

  getDisplayFeatures(plan: BillingPlan): string[] {
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

  // User clicked "Upgrade" on a tier card
  triggerUpgrade(plan: BillingPlan): void {
    this.selectedPlan = plan;
    this.checkoutLoadingId = plan.id;
    
    this.adminService.createSubscriptionCheckout(plan.id).subscribe({
      next: (res) => {
        if (res.clientSecret) {
          // Paid plan — open Stripe Embedded Checkout
          this.clientSecret = res.clientSecret;
          this.showPaymentModal = true;
        } else if (res.success) {
          // Free/downgrade plan — applied instantly
          this.showSuccess(res.message || 'Plan updated successfully!');
          this.loading = true;
          this.fetchBillingData();
        }
        this.checkoutLoadingId = null;
      },
      error: (err) => {
        console.error("Failed to generate stripe session", err);
        this.checkoutLoadingId = null;
      }
    });
  }

  closeModal(): void {
    this.showPaymentModal = false;
    this.selectedPlan = null;
    this.clientSecret = '';
  }

  onPaymentComplete(): void {
    if (this.clientSecret) {
      // clientSecret format is usually: {SESSION_ID}_secret_{SECRET}
      const sessionId = this.clientSecret.split('_secret_')[0];
      this.closeModal();
      console.log('[AdminBilling] Payment completed. Verifying session instantly:', sessionId);
      this.verifySession(sessionId);
    } else {
      this.closeModal();
    }
  }

  private applyInitialSuccessMessage(): void {
    if (this.initialSuccessMessage) {
      this.showSuccess(this.initialSuccessMessage);
    }
  }

  private showSuccess(msg: string): void {
    this.errorMessage = null;
    this.successMessage = msg;
    setTimeout(() => { this.successMessage = null; }, 6000);
  }

  private showError(msg: string): void {
    this.successMessage = null;
    this.errorMessage = msg;
    setTimeout(() => { this.errorMessage = null; }, 8000);
  }
}
