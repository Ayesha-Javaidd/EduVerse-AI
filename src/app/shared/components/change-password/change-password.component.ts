import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'],
})
export class ChangePasswordComponent implements OnInit {
  @Input() isSuperAdmin = false;

  changePasswordForm: FormGroup;

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(private fb: FormBuilder) {
    this.changePasswordForm = this.fb.group(
      {
        oldPassword: [''], // Will enable/disable dynamically
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator } // ✅ attach mismatch validator
    );
  }

  ngOnInit(): void {
    if (!this.isSuperAdmin) {
      this.changePasswordForm.get('oldPassword')?.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      this.changePasswordForm.get('oldPassword')?.clearValidators();
    }

    this.changePasswordForm.get('oldPassword')?.updateValueAndValidity();
  }

  // ✅ Custom Validator for mismatch
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  toggleOldPassword() {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (this.changePasswordForm.valid) {

      alert('Password changed successfully');
    } else {
      this.changePasswordForm.markAllAsTouched();
    }
  }
}
