import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, NgIf],
  templateUrl: './student-signup.component.html',
  styleUrls: ['./student-signup.component.css'],
})
export class StudentSignupComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  contactNo = '';
  country = '';
  status = 'active';

  errorMessage = '';
  loading = false;

  constructor(private router: Router, private authService: AuthService) {}

  validateForm(): boolean {
    this.errorMessage = '';

    if (!this.fullName.trim()) return this.fail('Full name is required.');
    if (!this.email.trim()) return this.fail('Email is required.');
    if (!this.validateEmail(this.email))
      return this.fail('Invalid email format.');
    if (!this.password.trim()) return this.fail('Password is required.');
    if (this.password.length < 6)
      return this.fail('Password must be at least 6 characters.');
    if (this.password !== this.confirmPassword)
      return this.fail('Passwords do not match.');
    if (!this.contactNo.trim()) return this.fail('Contact number is required.');
    if (!this.country.trim()) return this.fail('Country is required.');
    if (!this.status.trim()) return this.fail('Status is required.');

    return true;
  }

  fail(msg: string): false {
    this.errorMessage = msg;
    return false;
  }

  validateEmail(email: string): boolean {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  onSignup(f: NgForm) {
    if (!this.validateForm()) return;

    this.loading = true;

    const payload = {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      contactNo: this.contactNo,
      country: this.country,
      status: this.status,
      role: 'student',
    };

    console.log('Student signup payload:', payload);

    this.authService.signup(payload, 'student').subscribe({
      next: (res) => {
        console.log('Signup successful:', res);
        this.loading = false;
        // Navigate to login after successful signup
        this.router.navigate(['/login']);
        // Optionally: auto-login using authService.login(payload)
      },
      error: (err) => {
        console.error('Signup error:', err);
        this.loading = false;
        this.errorMessage = err?.error?.detail?.[0]?.msg || 'Signup failed';
      },
    });
  }
}
