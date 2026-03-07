// import { Component, Input, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   ReactiveFormsModule,
//   FormBuilder,
//   FormGroup,
//   Validators,
// } from '@angular/forms';
// import { ButtonComponent } from '../button/button.component';
// import { finalize } from 'rxjs/operators';
// import { ChangePasswordPayload } from '../../models/student-profile.models';

// import { AdminService } from '../../services/admin-profile.service';
// import { AuthService } from '../../../features/auth/services/auth.service';
// import { ToastService } from '../../services/toast.service';
// import { StudentProfileService } from '../../services/student-profile-service';
// import { TeacherProfileService } from '../../services/teacher-profile.service';

// @Component({
//   selector: 'app-change-password',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
//   templateUrl: './change-password.component.html',
//   styleUrls: ['./change-password.component.css'],
// })
// export class ChangePasswordComponent implements OnInit {
//   @Input() isSuperAdmin = false;

//   changePasswordForm: FormGroup;
//   showOldPassword = false;
//   showNewPassword = false;
//   showConfirmPassword = false;
//   isLoading = false;

//   role: 'student' | 'admin' | 'teacher' | null = null;

//   constructor(
//     private fb: FormBuilder,
//     private studentService: StudentProfileService,
//     private adminService: AdminService,
//     private teacherService: TeacherProfileService,
//     private authService: AuthService,
//     private toastService: ToastService,
//   ) {
//     this.changePasswordForm = this.fb.group(
//       {
//         oldPassword: [''],
//         password: ['', [Validators.required, Validators.minLength(6)]],
//         confirmPassword: ['', Validators.required],
//       },
//       { validators: this.passwordMatchValidator },
//     );
//   }

//   ngOnInit(): void {
//     this.role = this.authService.getRole() as 'student' | 'admin' | 'teacher';

//     if (!this.isSuperAdmin) {
//       this.changePasswordForm
//         .get('oldPassword')
//         ?.setValidators([Validators.required, Validators.minLength(6)]);
//     } else {
//       this.changePasswordForm.get('oldPassword')?.clearValidators();
//     }
//     this.changePasswordForm.get('oldPassword')?.updateValueAndValidity();
//   }

//   passwordMatchValidator(group: FormGroup) {
//     const password = group.get('password')?.value;
//     const confirm = group.get('confirmPassword')?.value;
//     return password === confirm ? null : { mismatch: true };
//   }

//   toggleOldPassword() {
//     this.showOldPassword = !this.showOldPassword;
//   }

//   toggleNewPassword() {
//     this.showNewPassword = !this.showNewPassword;
//   }

//   toggleConfirmPassword() {
//     this.showConfirmPassword = !this.showConfirmPassword;
//   }

//   onSubmit() {
//     if (!this.changePasswordForm.valid) {
//       this.changePasswordForm.markAllAsTouched();
//       this.toastService.warning('Please fill all required fields correctly');
//       return;
//     }

//     if (!this.role) return;

//     const payload: ChangePasswordPayload = {
//       oldPassword: this.changePasswordForm.value.oldPassword,
//       newPassword: this.changePasswordForm.value.password,
//     };
//     if (payload.oldPassword === payload.newPassword) {
//       alert('New password must be different from old password');
//       return;
//     }

//     console.log('payload', payload);
//     let service$;
//     if (this.role === 'student') {
//       service$ = this.studentService.changeMyPassword(payload);
//     } else if (this.role === 'admin') {
//       service$ = this.adminService.changePassword(payload);
//     } else if (this.role === 'teacher') {
//       service$ = this.teacherService.changeMyPassword(payload);
//     } else {
//       this.toastService.error('Cannot change password for this role');
//       return;
//     }

//     this.isLoading = true;
//     service$.pipe(finalize(() => (this.isLoading = false))).subscribe({
//       next: () => {
//         this.toastService.success('Password changed successfully');
//         this.changePasswordForm.reset();
//       },
//       error: (err: any) => {
//         console.error('Error changing password:', err);
//         this.toastService.error('Failed to change password');
//       },
//     });
//   }
// }

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ButtonComponent } from '../button/button.component';
import { AuthService } from '../../../features/auth/services/auth.service';
import { ToastService } from '../../services/toast.service';

import { StudentProfileService } from '../../services/student-profile-service';
import { AdminService } from '../../services/admin-profile.service';
import { TeacherProfileService } from '../../services/teacher-profile.service';

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

  role: 'student' | 'admin' | 'teacher' | null = null;

  constructor(
    private fb: FormBuilder,
    private studentService: StudentProfileService,
    private adminService: AdminService,
    private teacherService: TeacherProfileService,
    private authService: AuthService,
    private toastService: ToastService,
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
    this.role = this.authService.getRole() as 'student' | 'admin' | 'teacher';

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
    return group.get('password')?.value === group.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  // togglers (required by HTML)
  toggleOldPassword(): void {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (!this.changePasswordForm.valid || !this.role) {
      this.toastService.warning('Please fill all required fields correctly');
      return;
    }

    const payload = {
      oldPassword: this.changePasswordForm.value.oldPassword,
      newPassword: this.changePasswordForm.value.password,
    };

    if (payload.oldPassword === payload.newPassword) {
      this.toastService.warning('New password must be different');
      return;
    }

    let service$;

    if (this.role === 'student') {
      service$ = this.studentService.changeMyPassword(payload);
    } else if (this.role === 'admin') {
      service$ = this.adminService.changePassword(payload);
    } else {
      service$ = this.teacherService.changeMyPassword(payload);
    }

    this.isLoading = true;

    service$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.toastService.success('Password changed successfully');
        this.changePasswordForm.reset();
      },
      error: () => {
        this.toastService.error('Failed to change password');
      },
    });
  }
}
