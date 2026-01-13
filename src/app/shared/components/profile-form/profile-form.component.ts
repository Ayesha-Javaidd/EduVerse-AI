import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.css'],
})
export class ProfileFormComponent {
  profileForm: FormGroup;
  profilePreview: string | ArrayBuffer | null = '';
  defaultAvatar: string = 'assets/default-avatar.jpg';

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      fullName: ['John Doe', [Validators.required, Validators.minLength(3)]],
      email: ['john.doe@example.com', [Validators.required, Validators.email]],
      phone: ['1234567890', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      country: ['us', Validators.required], // 👈 default "United States"
      profilePicture: [null]
    });
  }
  get profileImage(): string {
    return (this.profilePreview as string) || this.defaultAvatar;
  }

  // Handle file upload + preview
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
    if (this.profileForm.valid) {

      alert('Profile updated successfully');
    } else {
      this.profileForm.markAllAsTouched();
    }
  }
}
