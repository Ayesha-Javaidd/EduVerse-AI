import { Component } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ProfileFormComponent } from '../../../../shared/components/profile-form/profile-form.component';
import { ChangePasswordComponent } from '../../../../shared/components/change-password/change-password.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-settings',
  imports: [
    HeaderComponent,
    CommonModule,
    ChangePasswordComponent,
    ProfileFormComponent,
  ],
  templateUrl: './student-settings.component.html',
  styleUrls: ['./student-settings.component.css'],
})
export class StudentSettingsComponent {
  activeTab: 'profile' | 'system' = 'profile';
}
