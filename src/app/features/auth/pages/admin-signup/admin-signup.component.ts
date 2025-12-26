import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-signup',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './admin-signup.component.html',
  styleUrls: ['./admin-signup.component.css'],
})
export class AdminSignupComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  contactNo = '';
  country = '';
  status = 'active';
  profileImageURL = '';
  tenantName = '';
  tenantLogoUrl = '';

  errorMessage = '';

  constructor(private router: Router, private authService: AuthService) {}

  onSignup() {
    if (!this.validateForm()) return;

    const payload = {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      contactNo: this.contactNo,
      country: this.country,
      status: this.status,
      role: 'admin',
      profileImageURL: this.profileImageURL,
      tenantName: this.tenantName,
      tenantLogoUrl: this.tenantLogoUrl,
    };

    this.authService.signup(payload, 'admin').subscribe({
      next: (res) => {
        console.log('Signup success:', res);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.detail?.[0]?.msg || 'Signup failed';
      },
    });
  }

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
    if (!this.tenantName.trim()) return this.fail('Tenant name is required.');

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
}
