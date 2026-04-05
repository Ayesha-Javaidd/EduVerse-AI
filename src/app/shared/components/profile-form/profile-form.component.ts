import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize, Observable } from 'rxjs';

import { ButtonComponent } from '../button/button.component';
import { CountrySelectComponent } from '../country-select/country-select.component';
import { PhoneInputComponent } from '../phone-input/phone-input.component';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../../features/auth/services/auth.service';

import {
  StudentProfile,
  StudentUpdatePayload,
} from '../../models/student-profile.models';
import {
  AdminProfile,
  AdminUpdateProfilePayload,
} from '../../../shared/models/admin-profile.models';
import {
  TeacherResponse,
  TeacherUpdatePayload,
} from '../../models/teacher-profile.models';

import { StudentProfileService } from '../../services/student-profile-service';
import { AdminProfileService } from '../../services/admin-profile.service';
import { TeacherProfileService } from '../../services/teacher-profile.service';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, PhoneInputComponent, CountrySelectComponent],
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.css'],
})
export class ProfileFormComponent implements OnInit {
  profileForm!: FormGroup;

  profilePreview: string | null = null;
  defaultAvatar = 'assets/images/profile.png';
  isLoading = false;

  role: 'student' | 'admin' | 'teacher' | null = null;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private authService: AuthService,
    private studentService: StudentProfileService,
    private adminService: AdminProfileService,
    private teacherService: TeacherProfileService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.role = this.authService.getRole() as 'student' | 'admin' | 'teacher';

    if (!this.role) {
      this.toastService.error('Cannot determine user role');
      return;
    }

    this.loadProfile();
  }

  private buildForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phone: [''],
      country: [''],
    });
  }

  private loadProfile(): void {
    this.isLoading = true;

    let service$: Observable<StudentProfile | AdminProfile | TeacherResponse>;

    switch (this.role) {
      case 'student':
        service$ = this.studentService.getMyProfile();
        break;
      case 'admin':
        service$ = this.adminService.getMyProfile();
        break;
      case 'teacher':
        service$ = this.teacherService.getMyProfile();
        break;
      default:
        this.toastService.error('Invalid role');
        return;
    }

    service$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          fullName: profile.fullName ?? '',
          email: profile.email ?? '',
          phone: profile.contactNo ?? '',
          country: profile.country || '',
        });

        this.profilePreview = profile.profileImageURL ?? null;
      },
      error: () => {
        this.toastService.error('Failed to load profile');
      },
    });
  }

  /** Used directly by HTML */
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      this.profilePreview = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.role) {
      this.profileForm.markAllAsTouched();
      this.toastService.warning('Please correct the form errors');
      return;
    }

    this.isLoading = true;

    if (this.role === 'student') {
      const payload: StudentUpdatePayload = {
        fullName: this.profileForm.value.fullName,
        contactNo: this.profileForm.value.phone,
        country: this.profileForm.value.country,
        profileImageURL: this.profilePreview,
      };

      this.studentService
        .updateMyProfile(payload)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => this.toastService.success('Profile updated successfully'),
          error: () => this.toastService.error('Update failed'),
        });
    }

    if (this.role === 'admin') {
      const payload: AdminUpdateProfilePayload = {
        fullName: this.profileForm.value.fullName,
        contactNo: this.profileForm.value.phone,
        country: this.profileForm.value.country,
        profileImageURL: this.profilePreview ?? undefined,
      };

      this.adminService
        .updateMyProfile(payload)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => this.toastService.success('Profile updated successfully'),
          error: () => this.toastService.error('Update failed'),
        });
    }

    if (this.role === 'teacher') {
      const payload: TeacherUpdatePayload = {
        fullName: this.profileForm.value.fullName,
        contactNo: this.profileForm.value.phone,
        country: this.profileForm.value.country,
        profileImageURL: this.profilePreview ?? undefined,
      };

      this.teacherService
        .updateMyProfile(payload)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => this.toastService.success('Profile updated successfully'),
          error: () => this.toastService.error('Update failed'),
        });
    }
  }
}
