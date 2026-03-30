import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
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
export class SettingsComponent {
  activeTab: 'profile' | 'system' | 'billing' = 'profile';
}
