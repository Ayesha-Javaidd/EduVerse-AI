import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ChangePasswordComponent } from '../../../../shared/components/change-password/change-password.component';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { SuperAdminService, SuperAdminResponse } from '../../services/super-admin.service';
import { CountrySelectComponent } from '../../../../shared/components/country-select/country-select.component';
import { PhoneInputComponent } from '../../../../shared/components/phone-input/phone-input.component';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-super-admin-settings',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, ChangePasswordComponent, PhoneInputComponent, CountrySelectComponent],
  templateUrl: './super-admin-settings.component.html',
  styleUrl: './super-admin-settings.component.css'
})
export class SuperAdminSettingsComponent implements OnInit {
  profileForm!: FormGroup;
  profile: SuperAdminResponse | null = null;
  loading: boolean = true;

  constructor(
    private fb: FormBuilder,
    private superAdminService: SuperAdminService,
    private confirmDialogService: ConfirmDialogService,
    private authService: AuthService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }],
      contactNo: [''],
      country: ['']
    });
  }

  private loadProfile(): void {
    this.loading = true;
    this.superAdminService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        const user = data.user;
        this.profileForm.patchValue({
          fullName: user.fullName || '',
          email: user.email || '',
          contactNo: user.contactNo || '',
          country: user.country || ''
        });
        this.syncCurrentUserProfile(user);
        this.loading = false;
      },
      error: (err) => {
        console.error("Failed to load profile", err);
        this.loading = false;
      }
    });
  }

  async onSave(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const payload = this.profileForm.getRawValue();
    // remove empty strings or disabled
    const updates = {
      fullName: payload.fullName,
      contactNo: payload.contactNo,
      country: payload.country
    };

    this.superAdminService.updateProfile(updates).subscribe({
      next: async (res) => {
        this.profile = res;
        this.syncCurrentUserProfile(res.user);
        await this.confirmDialogService.alert("Profile details successfully updated!");
      },
      error: async (err) => {
        await this.confirmDialogService.alert("Failed to update profile", "Error");
      }
    });
  }

  // Uses auth service automatically via component
  onPasswordChanged(event: any): void {
    // Password change logic handled by inner component
  }

  private syncCurrentUserProfile(user: SuperAdminResponse['user']): void {
    this.authService.updateCurrentUser({
      fullName: user.fullName || undefined,
      profileImageURL: user.profileImageURL || undefined,
    });
  }
}
