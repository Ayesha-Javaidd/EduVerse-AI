import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { TenantInfoFormComponent } from '../../components/tenant-info-form/tenant-info-form.component';
import { SubscriptionDetailsComponent } from '../../components/subscription-details/subscription-details.component';
import { AccountActionsComponent } from '../../components/account-actions/account-actions.component';
import { TenantService } from '../../services/tenant.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';

@Component({
  selector: 'app-super-admin-tenant-settings',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TenantInfoFormComponent, SubscriptionDetailsComponent, AccountActionsComponent],
  templateUrl: './super-admin-tenant-settings.component.html',
  styleUrl: './super-admin-tenant-settings.component.css'
})
export class SuperAdminTenantSettingsComponent implements OnInit, OnDestroy {
  tenant: any = null;
  subscriptionDetails: any = null;

  private sub!: Subscription;

  constructor(private tenantService: TenantService, private route: ActivatedRoute) { }

  // Added a route resolver so the tenant data is fetched before page load
  resolve(route: ActivatedRouteSnapshot) {
    const id = Number(route.paramMap.get('id'));
    return this.tenantService.getTenantById(id);
  }

  ngOnInit(): void {
    const tenantId = Number(this.route.snapshot.paramMap.get('id'));
    const tenant = this.tenantService.getTenantById(tenantId);

    if (tenant) {
      this.tenantService.setSelectedTenant(tenant);
    }

    this.sub = this.tenantService.getSelectedTenant().subscribe((tenant) => {
      if (tenant) {
        this.tenant = tenant;
        this.subscriptionDetails = tenant.subscription;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  onSaveTenant(payload: any) {
    this.tenantService.updateTenant(payload);
    alert('Tenant information updated!');
  }

  onUpgrade() {
    alert('Upgrade flow not implemented in mock.');
  }

  onRenew() {
    alert('Renewal flow not implemented in mock.');
  }

  onDeactivate() {
    if (confirm(`Deactivate tenant "${this.tenant.name}"?`)) {
      this.tenant.subscription.status = 'Inactive';
      this.tenantService.updateTenant(this.tenant);
      alert('Tenant deactivated.');
    }
  }

  onDelete() {
    if (confirm(`Delete tenant "${this.tenant.name}" permanently?`)) {
      alert('Tenant deleted (mock).');
    }
  }
}
