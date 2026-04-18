import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ChangePasswordComponent } from '../../../../shared/components/change-password/change-password.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PhoneInputComponent } from '../../../../shared/components/phone-input/phone-input.component';
import { CountrySelectComponent } from '../../../../shared/components/country-select/country-select.component';

@Component({
  selector: 'app-tenant-info-form',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ChangePasswordComponent, ReactiveFormsModule, PhoneInputComponent, CountrySelectComponent],
  templateUrl: './tenant-info-form.component.html',
  styleUrl: './tenant-info-form.component.css'
})
export class TenantInfoFormComponent implements OnChanges {
  @Input() tenant: any = null;
  @Output() save = new EventEmitter<any>();

  form!: FormGroup;
  showChangePassword = false;
  logoPreview: string | null = 'assets/images/profile.png';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      tenantName: ['', Validators.required],
      adminEmail: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      contactNumber: ['', Validators.required],
      address: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tenant'] && changes['tenant'].currentValue) {
      const data = changes['tenant'].currentValue;
      this.form.patchValue({
        tenantName: data.tenantName || '',
        adminEmail: data.adminEmail || '',
        contactNumber: data.contactNumber || '',
        address: data.address || data.country || ''
      });
      this.logoPreview = data.tenantLogoUrl || 'assets/images/profile.png';
    }
  }

  toggleChangePassword() {
    this.showChangePassword = !this.showChangePassword;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      this.logoPreview = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { country, ...tenantData } = this.tenant || {};
    const payload = {
      ...tenantData,
      ...this.form.getRawValue(),
      tenantLogoUrl: this.logoPreview === 'assets/images/profile.png' ? '' : this.logoPreview || '',
    };
    this.save.emit(payload);
  }

  onPasswordChanged(event: any) {

  }
}
