import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: true
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService // UPDATED: Injected AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      // UPDATED: Now calling real backend service with proper types
      this.authService.login(email, password).subscribe({
        next: (response: { user: { role: string }, access_token: string }) => {

          const role = response.user.role;

          // Navigate based on user role
          if (role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else if (role === 'teacher') {
            this.router.navigate(['/teacher/dashboard']);
          } else if (role === 'student') {
            this.router.navigate(['/student/dashboard']);
          } else if (role === 'super_admin') {
            this.router.navigate(['/super-admin/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err: { error?: { detail?: string } }) => {
          console.error('Login failed', err);
          this.errorMessage = err.error?.detail || 'Invalid email or password';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
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
