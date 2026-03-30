import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TenantResponse } from '../../services/tenant.service';
import { SubscriptionPlan } from '../../services/subscription-plans.service';

@Component({
  selector: 'app-subscription-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-details.component.html',
  styleUrl: './subscription-details.component.css'
})
export class SubscriptionDetailsComponent {
  @Input() tenant: TenantResponse | null = null;
  @Input() availablePlans: SubscriptionPlan[] = [];
  
  @Output() assignPlan = new EventEmitter<string>();
  @Output() renew = new EventEmitter<void>();

  selectedPlanId: string = '';

  get remainingDays(): number {
    if (!this.tenant?.subscriptionExpiryDate) {
      return 0;
    }
    const now = new Date();
    const expiryDate = new Date(this.tenant.subscriptionExpiryDate);
    const difference = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, difference);
  }

  onAssign() {
    if (this.selectedPlanId) {
      this.assignPlan.emit(this.selectedPlanId);
      this.selectedPlanId = ''; // Reset dropdown
    }
  }

  onRenew() {
    this.renew.emit();
  }
}
