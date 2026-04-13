import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
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
  pendingSessionId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Use take(1) so cleaning the URL doesn't re-trigger this logic
    this.route.queryParamMap.pipe(take(1)).subscribe((params) => {
      const requestedTab = params.get('tab');
      const billingSuccess = params.get('billing_success');
      const sessionId = params.get('session_id');

      if (requestedTab === 'profile' || requestedTab === 'system' || requestedTab === 'billing') {
        this.activeTab = requestedTab;
      }

      if (billingSuccess === 'true' || billingSuccess === '1') {
        this.activeTab = 'billing';
        this.billingFlashMessage = 'Billing updated successfully.';
      }

      if (sessionId) {
        this.activeTab = 'billing';
        this.pendingSessionId = sessionId;
      }

      // Clean up query params from URL
      if (requestedTab || billingSuccess || sessionId) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            tab: null,
            billing_success: null,
            session_id: null,
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
