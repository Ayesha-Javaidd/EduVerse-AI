import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { TenantInfoFormComponent } from '../../components/tenant-info-form/tenant-info-form.component';
import { SubscriptionDetailsComponent } from '../../components/subscription-details/subscription-details.component';
import { AccountActionsComponent } from '../../components/account-actions/account-actions.component';
import { TenantService, TenantResponse } from '../../services/tenant.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import {
  SubscriptionPlansService,
  SubscriptionPlan,
} from '../../services/subscription-plans.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-super-admin-tenant-settings',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    TenantInfoFormComponent,
    SubscriptionDetailsComponent,
    AccountActionsComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './super-admin-tenant-settings.component.html',
  styleUrl: './super-admin-tenant-settings.component.css',
})
export class SuperAdminTenantSettingsComponent implements OnInit, OnDestroy {
  tenant: TenantResponse | null = null;
  availablePlans: SubscriptionPlan[] = [];

  private sub!: Subscription;

  constructor(
    private tenantService: TenantService,
    private plansService: SubscriptionPlansService,
    private route: ActivatedRoute,
    private confirmDialogService: ConfirmDialogService,
  ) {}

  loading: boolean = true;

  ngOnInit(): void {
    this.loading = true;

    const tenantId = this.route.snapshot.paramMap.get('id');

    if (tenantId) {
      this.tenantService.getTenantByIdApi(tenantId).subscribe({
        next: (t) => {
          this.tenant = t;
          this.checkLoadingComplete();
        },
        error: () => (this.loading = false),
      });
    }

    this.plansService.getAllPlans('active').subscribe({
      next: (plans) => {
        this.availablePlans = plans;
        this.checkLoadingComplete();
      },
      error: () => (this.loading = false),
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  private checkLoadingComplete() {
    if (this.tenant && this.availablePlans.length > 0) {
      this.loading = false;
    }
  }

  async onSaveTenant(payload: any) {
    if (!this.tenant) return;
    this.tenantService.updateTenantApi(this.tenant.id, payload).subscribe({
      next: async (res) => {
        this.tenant = res;
        await this.confirmDialogService.alert('Tenant information updated!');
      },
      error: (err) => console.error(err),
    });
  }

  async onAssignPlan(planId: string) {
    if (!this.tenant) return;
    const selectedPlan = this.availablePlans.find((p) => p.id === planId);
    if (!selectedPlan) return;

    const isConfirmed = await this.confirmDialogService.confirm(
      'Assign Plan',
      `Upgrade this tenant to the ${selectedPlan.name} plan?`,
    );
    if (isConfirmed) {
      this.tenantService
        .updateTenantApi(this.tenant.id, {
          subscriptionId: selectedPlan.id,
          subscriptionPlan: selectedPlan.name,
          subscriptionCategory: selectedPlan.category,
          subscriptionBillingCycle: selectedPlan.billingCycle,
          subscriptionPriceMonthly: selectedPlan.pricePerMonth,
        })
        .subscribe({
          next: async (res) => {
            this.tenant = res;
            await this.confirmDialogService.alert(
              `Tenant successfully upgraded to ${selectedPlan.name}!`,
            );
          },
          error: (err) => console.error('Error assigning plan', err),
        });
    }
  }

  async onRenew() {
    await this.confirmDialogService.alert('Renewal cycle logged.');
  }

  async onDeactivate() {
    if (!this.tenant) return;
    const isConfirmed = await this.confirmDialogService.confirm(
      'Deactivate Tenant',
      `Deactivate tenant "${this.tenant.tenantName}"?`,
    );
    if (isConfirmed) {
      this.tenantService
        .updateTenantApi(this.tenant.id, { status: 'inactive' })
        .subscribe({
          next: async (res) => {
            this.tenant = res;
            await this.confirmDialogService.alert('Tenant deactivated.');
          },
        });
    }
  }

  async onActivate() {
    if (!this.tenant) return;
    this.tenantService
      .updateTenantApi(this.tenant.id, { status: 'active' })
      .subscribe({
        next: async (res) => {
          this.tenant = res;
          await this.confirmDialogService.alert(
            'Tenant activated successfully.',
          );
        },
      });
  }

  async onGrantGracePeriod() {
    if (!this.tenant) return;
    const isConfirmed = await this.confirmDialogService.confirm(
      'Grant Grace Period',
      'Grant a 7-day manual grace period to this tenant?',
    );
    if (isConfirmed) {
      const now = new Date();
      now.setDate(now.getDate() + 7);
      this.tenantService
        .updateTenantApi(this.tenant.id, {
          gracePeriodUntil: now.toISOString(),
        })
        .subscribe({
          next: async (res) => {
            this.tenant = res;
            await this.confirmDialogService.alert(
              '7-day grace period granted.',
            );
          },
        });
    }
  }

  async onDelete() {
    if (!this.tenant) return;
    const isConfirmed = await this.confirmDialogService.confirmDelete(
      this.tenant.tenantName,
    );
    if (isConfirmed) {
      this.tenantService.deleteTenantApi(this.tenant.id).subscribe({
        next: async () => {
          await this.confirmDialogService.alert('Tenant deleted.');
        },
      });
    }
  }
}
