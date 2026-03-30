import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../core/services/admin.service';
import { HttpClientModule } from '@angular/common/http';
import { StripeEmbeddedModalComponent } from '../../../../shared/components/stripe-embedded-modal/stripe-embedded-modal.component';

@Component({
  selector: 'app-admin-billing',
  standalone: true,
  imports: [CommonModule, HttpClientModule, StripeEmbeddedModalComponent],
  templateUrl: './admin-billing.component.html',
  styleUrls: ['./admin-billing.component.css']
})
export class AdminBillingComponent implements OnInit {
  
  loading = true;
  usageData: any = null;
  availablePlans: any[] = [];
  
  // Modal state
  showPaymentModal: boolean = false;
  selectedPlan: any = null;
  clientSecret: string = '';
  
  checkoutLoadingId: string | null = null;
  successMessage: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.fetchBillingData();
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
        this.availablePlans = plans;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load available plans', err);
        this.loading = false;
      }
    });
  }

  getUsagePercentage(used: number, max: number): number {
    if (max <= 0 || max === null || max === undefined) return 0; // Unlimited
    const percent = (used / max) * 100;
    return percent > 100 ? 100 : percent;
  }

  isUnlimited(val: number): boolean {
    return val === -1 || val === null || val === undefined;
  }

  // User clicked "Upgrade" on a tier card
  triggerUpgrade(plan: any): void {
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
          this.successMessage = res.message || 'Plan updated successfully!';
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
}
