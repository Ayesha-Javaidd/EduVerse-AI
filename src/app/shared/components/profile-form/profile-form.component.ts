import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { finalize, Observable } from 'rxjs';

import { ButtonComponent } from '../button/button.component';
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
import { AdminService } from '../../../features/admin/services/admin-profile.service';
import { StudentProfileService } from '../../services/student-profile-service';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.css'],
})
export class ProfileFormComponent implements OnInit {
  profileForm: FormGroup;
  profilePreview: string | ArrayBuffer | null = '';
  defaultAvatar = 'assets/default-avatar.jpg';
  isLoading = false;
  role: 'student' | 'admin' | null = null;

  // Map backend country names to <select> values
  countryMap: Record<string, string> = {
    Pakistan: 'pk',
    Germany: 'ger',
    'United States': 'us',
    'United Kingdom': 'uk',
    India: 'in',
  };

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private authService: AuthService,
    private studentService: StudentProfileService,
    private adminService: AdminService,
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10,15}$/)]],
      country: [''],
      profilePicture: [null],
    });
  }

  ngOnInit(): void {
    this.role = this.authService.getRole() as 'student' | 'admin';
    if (!this.role) {
      this.toastService.error('Cannot determine user role');
      return;
    }
    this.loadProfile();
  }

  private loadProfile(): void {
    this.isLoading = true;

    // Strongly type the observable
    let service$: Observable<StudentProfile | AdminProfile>;
    if (this.role === 'student') {
      service$ = this.studentService.getMyProfile();
    } else {
      service$ = this.adminService.getMyProfile();
    }

    service$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: (profile) => {
        const countryValue = profile.country
          ? this.countryMap[profile.country]
          : '';

        this.profileForm.patchValue({
          fullName: profile.fullName || '',
          email: profile.email || '',
          phone: (profile as any).contactNo || (profile as any).phone || '',
          country: countryValue,
        });

        if ((profile as any).profileImageURL) {
          this.profilePreview = (profile as any).profileImageURL;
        }
      },
      error: (err: any) => {
        console.error('Error fetching profile:', err);
        this.toastService.error('Failed to load profile');
      },
    });
  }

  get profileImage(): string {
    return (this.profilePreview as string) || this.defaultAvatar;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.profileForm.patchValue({ profilePicture: file });

      const reader = new FileReader();
      reader.onload = () => (this.profilePreview = reader.result);
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (!this.profileForm.valid) {
      this.profileForm.markAllAsTouched();
      this.toastService.warning('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;

    if (this.role === 'student') {
      const payload: StudentUpdatePayload = {
        fullName: this.profileForm.value.fullName || undefined,
        email: this.profileForm.value.email || undefined,
        contactNo: this.profileForm.value.phone || undefined,
        country: this.profileForm.value.country || undefined,
        profileImageURL: this.profilePreview as string | null, // student allows null
      };

      this.studentService
        .updateMyProfile(payload)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => this.toastService.success('Profile updated successfully'),
          error: (err: any) => {
            console.error('Error updating profile:', err);
            this.toastService.error('Failed to update profile');
          },
        });
    } else if (this.role === 'admin') {
      const payload: AdminUpdateProfilePayload = {
        fullName: this.profileForm.value.fullName || undefined,
        contactNo: this.profileForm.value.phone || undefined,
        country: this.profileForm.value.country || undefined,
        profileImageURL: (this.profilePreview as string | null) ?? undefined, // convert null to undefined
      };

      this.adminService
        .updateMyProfile(payload)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => this.toastService.success('Profile updated successfully'),
          error: (err: any) => {
            console.error('Error updating profile:', err);
            this.toastService.error('Failed to update profile');
          },
        });
    }
  }
}
