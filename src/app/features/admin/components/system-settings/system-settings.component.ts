import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AdminService, SystemSettingsConfig } from '../../../../core/services/admin.service';
import { TenantBrandingService } from '../../../../shared/services/tenant-branding.service';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.css'],
})
export class SystemSettingsComponent implements OnInit {
  logoPreview: string | ArrayBuffer | null = 'assets/images/profile.png';
  tenantName: string = '';
  isLoading: boolean = true;
  isSaving: boolean = false;

  constructor(
    private adminService: AdminService,
    private tenantBrandingService: TenantBrandingService,
  ) {}

  ngOnInit() {
    this.fetchSettings();
  }

  fetchSettings() {
    this.isLoading = true;
    this.adminService.getSystemSettings().subscribe({
      next: (data: SystemSettingsConfig) => {
        if (data.tenantName) this.tenantName = data.tenantName;
        if (data.tenantLogoUrl) this.logoPreview = data.tenantLogoUrl;
        this.tenantBrandingService.updateBranding(data);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse | Error) => {
        console.error('Failed to parse system settings', err);
        this.isLoading = false;
      }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      const reader = new FileReader();
      reader.onload = () => (this.logoPreview = reader.result);
      reader.readAsDataURL(file);
    }
  }

  onSave() {
    this.isSaving = true;
    const payload = {
      tenantName: this.tenantName,
      tenantLogoUrl: this.logoPreview === 'assets/images/profile.png' ? '' : (this.logoPreview as string) || ''
    };

    this.adminService.updateSystemSettings(payload).subscribe({
      next: (res: SystemSettingsConfig) => {
        this.isSaving = false;
        this.tenantBrandingService.updateBranding(res);
        // Optionally show toast success alert here!
      },
      error: (err: HttpErrorResponse | Error) => {
        console.error('Failed saving', err);
        this.isSaving = false;
      }
    });
  }
}
