import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SystemSettingsComponent } from '../../components/system-settings/system-settings.component';
import { ProfileFormComponent } from '../../../../shared/components/profile-form/profile-form.component';
import { ChangePasswordComponent } from "../../../../shared/components/change-password/change-password.component";
import { AdminBillingComponent } from '../admin-billing/admin-billing.component';

@Component({
  selector: 'app-settings',
  imports: [CommonModule,HeaderComponent, SystemSettingsComponent, ProfileFormComponent, ChangePasswordComponent, AdminBillingComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  activeTab: 'profile' | 'system' | 'billing' = 'profile';
  billingFlashMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const requestedTab = params.get('tab');
      const billingSuccess = params.get('billing_success');

      if (requestedTab === 'profile' || requestedTab === 'system' || requestedTab === 'billing') {
        this.activeTab = requestedTab;
      }

      if (billingSuccess === 'true' || billingSuccess === '1') {
        this.activeTab = 'billing';
        this.billingFlashMessage = 'Billing updated successfully.';
      }

      if (requestedTab || billingSuccess) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            tab: null,
            billing_success: null,
          },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  selectTab(tab: 'profile' | 'system' | 'billing'): void {
    this.activeTab = tab;
    if (tab !== 'billing') {
      this.billingFlashMessage = null;
    }
  }
}
