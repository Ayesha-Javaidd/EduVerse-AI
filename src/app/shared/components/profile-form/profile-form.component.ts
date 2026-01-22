import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { finalize } from 'rxjs/operators';
import { StudentProfileService } from '../../services/student-profile-service';
import {
  StudentProfile,
  StudentUpdatePayload,
} from '../../models/student-profile.models';
import { ToastService } from '../../services/toast.service';

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
  defaultAvatar: string = 'assets/default-avatar.jpg';
  isLoading: boolean = false;

  // Map backend country names to <select> values
  countryMap: { [key: string]: string } = {
    Pakistan: 'pk',
    Germany: 'ger',
    'United States': 'us',
    'United Kingdom': 'uk',
    India: 'in',
  };

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private profileService: StudentProfileService,
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
    this.loadProfile();
  }

  loadProfile() {
    console.log('Fetching student profile...');
    this.isLoading = true;

    this.profileService
      .getMyProfile()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (profile: StudentProfile) => {
          console.log('Profile fetched from backend:', profile);

          const countryValue = this.countryMap[profile.country || ''] || '';

          this.profileForm.patchValue({
            fullName: profile.fullName || '',
            email: profile.email || '',
            phone: profile.contactNo || '',
            country: countryValue,
          });

          console.log('Form after patchValue:', this.profileForm.value);

          if (profile.profileImageURL) {
            this.profilePreview = profile.profileImageURL;
          }
        },
        error: (err) => {
          console.error('Error fetching profile:', err);
          this.toastService.error('Failed to load profile');
        },
      });
  }

  get profileImage(): string {
    return (this.profilePreview as string) || this.defaultAvatar;
  }

  onFileChange(event: Event) {
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

    const payload: StudentUpdatePayload = {
      fullName: this.profileForm.value.fullName || undefined,
      email: this.profileForm.value.email || undefined,
      contactNo: this.profileForm.value.phone || undefined,
      country: this.profileForm.value.country || undefined,
      profileImageURL: this.profilePreview as string | null,
    };

    console.log('Updating profile with payload:', payload);

    this.isLoading = true;
    this.profileService
      .updateMyProfile(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (updatedProfile) => {
          console.log('Profile updated successfully:', updatedProfile);
          this.toastService.success('Profile updated successfully');
        },
        error: (err) => {
          console.error('Error updating profile:', err);
          this.toastService.error('Failed to update profile');
        },
      });
  }
}
