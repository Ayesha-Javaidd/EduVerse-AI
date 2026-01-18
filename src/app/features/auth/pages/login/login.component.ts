import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true, // important if using imports
  imports: [ReactiveFormsModule, NgIf, RouterLink, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'], // fixed typo
})
export class LoginComponent {
  loginForm: FormGroup;

  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const payload = this.loginForm.value;

    this.authService.login(payload).subscribe({
      next: () => {
        // navigation handled by AuthService
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;

        // Map backend error → user-friendly message
        if (err.status === 401) {
          this.errorMessage = 'Invalid email or password';
        } else if (err.status === 0) {
          this.errorMessage = 'Unable to connect to server';
        } else {
          this.errorMessage = 'Something went wrong. Please try again.';
        }
      },
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
