import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ChangePasswordComponent } from '../../../../shared/components/change-password/change-password.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-tenant-info-form',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ChangePasswordComponent, ReactiveFormsModule],
  templateUrl: './tenant-info-form.component.html',
  styleUrl: './tenant-info-form.component.css'
})
export class TenantInfoFormComponent implements OnChanges {
  @Input() tenant: any = null;
  @Output() save = new EventEmitter<any>();

  form!: FormGroup;
  showChangePassword = false;

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
        address: data.address || ''
      });
    }
  }

  toggleChangePassword() {
    this.showChangePassword = !this.showChangePassword;
  }

  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = { ...this.tenant, ...this.form.getRawValue() };
    this.save.emit(payload);
  }

  onPasswordChanged(event: any) {

  }
}
