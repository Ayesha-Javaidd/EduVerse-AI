import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SubscriptionPlansService, SubscriptionPlan } from '../../services/subscription-plans.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-super-admin-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './super-admin-subscriptions.component.html',
  styleUrls: ['./super-admin-subscriptions.component.css']
})
export class SuperAdminSubscriptionsComponent implements OnInit {
  pageTitle = 'Manage Subscription Plans';
  notificationCount = 0;
  plans: SubscriptionPlan[] = [];
  
  showModal = false;
  isEditMode = false;
  currentPlan: SubscriptionPlan = this.getEmptyPlan();

  constructor(
    private subscriptionService: SubscriptionPlansService,
    private confirmDialogService: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans() {
    this.subscriptionService.getAllPlans().subscribe({
      next: (data) => this.plans = data,
      error: (err) => console.error("Failed to load plans", err)
    });
  }

  getEmptyPlan(): SubscriptionPlan {
    return {
      code: '',
      name: '',
      category: 'custom',
      billingCycle: 'monthly',
      pricePerMonth: 0,
      features: [],
      status: 'active'
    };
  }

  openCreateModal() {
    this.isEditMode = false;
    this.currentPlan = this.getEmptyPlan();
    this.showModal = true;
  }

  openEditModal(plan: SubscriptionPlan) {
    this.isEditMode = true;
    this.currentPlan = { ...plan, features: [...(plan.features || [])] };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  savePlan() {
    if (this.isEditMode && this.currentPlan.id) {
      const { id, createdAt, updatedAt, ...updateData } = this.currentPlan;
      this.subscriptionService.updatePlan(id, updateData).subscribe({
        next: () => {
          this.closeModal();
          this.loadPlans();
        },
        error: (err) => console.error("Failed to update plan", err)
      });
    } else {
      this.subscriptionService.createPlan(this.currentPlan).subscribe({
        next: () => {
          this.closeModal();
          this.loadPlans();
        },
        error: (err) => console.error("Failed to create plan", err)
      });
    }
  }

  async deletePlan(plan: SubscriptionPlan) {
    if(!plan.id) return;
    const isConfirmed = await this.confirmDialogService.confirmDelete(`Plan: ${plan.name}`);
    if (isConfirmed) {
      this.subscriptionService.deletePlan(plan.id).subscribe({
        next: () => this.loadPlans(),
        error: (err) => console.error("Failed to delete plan", err)
      });
    }
  }

  addFeature(event: Event, inputEl: HTMLInputElement) {
    event.preventDefault();
    const val = inputEl.value.trim();
    if(val) {
      this.currentPlan.features = [...(this.currentPlan.features || []), val];
      inputEl.value = '';
    }
  }

  removeFeature(index: number) {
    this.currentPlan.features = this.currentPlan.features.filter((_, i) => i !== index);
  }
}
