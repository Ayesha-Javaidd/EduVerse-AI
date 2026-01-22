import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

import { finalize } from 'rxjs/operators';
import { ChangePasswordPayload } from '../../models/student-profile.models';
import { StudentProfileService } from '../../../features/student/services/student-profile.service';

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
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private profileService: StudentProfileService,
  ) {
    this.changePasswordForm = this.fb.group(
      {
        oldPassword: [''],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  ngOnInit(): void {
    if (!this.isSuperAdmin) {
      this.changePasswordForm
        .get('oldPassword')
        ?.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      this.changePasswordForm.get('oldPassword')?.clearValidators();
    }
    this.changePasswordForm.get('oldPassword')?.updateValueAndValidity();
  }

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
    if (!this.changePasswordForm.valid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    const payload: ChangePasswordPayload = {
      oldPassword: this.changePasswordForm.value.oldPassword,
      newPassword: this.changePasswordForm.value.password,
    };

    console.log('Changing password with payload:', payload);

    this.isLoading = true;
    this.profileService
      .changeMyPassword(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          console.log('Password changed successfully');
          alert('Password changed successfully');
          this.changePasswordForm.reset();
        },
        error: (err) => {
          console.error('Error changing password:', err);
          alert('Failed to change password');
        },
      });
  }
}
