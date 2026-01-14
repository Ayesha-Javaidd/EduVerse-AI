// import { Component } from '@angular/core';
// import { Router, RouterModule } from '@angular/router';
// import { FormsModule, NgForm } from '@angular/forms';
// import { NgIf } from '@angular/common';

// @Component({
//   selector: 'app-signup',
//   standalone: true,
//   imports: [FormsModule, NgIf, RouterModule],
//   templateUrl: './signup.component.html',
// })
// export class SignupComponent {
//   role: string = '';
//   fullName = '';
//   email = '';
//   password = '';
//   confirmPassword = '';

//   contactNo = '';
//   country = '';
//   status = '';
//   orgName = '';

//   errorMessage = '';

//   constructor(private router: Router) {}

//   validateForm(): boolean {
//     this.errorMessage = '';

//     if (!this.role) return this.fail('Please select a role.');
//     if (!this.fullName.trim()) return this.fail('Full name is required.');
//     if (!this.email.trim()) return this.fail('Email is required.');
//     if (!this.password.trim()) return this.fail('Password is required.');
//     if (this.password.length < 6)
//       return this.fail('Password must be at least 6 characters.');
//     if (this.password !== this.confirmPassword)
//       return this.fail('Passwords do not match.');

//     // Role-based validations
//     if (this.role === 'student') {
//       if (!this.contactNo.trim())
//         return this.fail('Contact number is required for students.');
//       if (!this.country.trim())
//         return this.fail('Country is required for students.');
//       if (!this.status.trim())
//         return this.fail('Status is required for students.');
//     }

//     if (this.role === 'admin') {
//       if (!this.orgName.trim())
//         return this.fail('Organization name is required for admins.');
//       if (!this.contactNo.trim())
//         return this.fail('Contact number is required for admins.');
//       if (!this.country.trim())
//         return this.fail('Country is required for admins.');
//     }

//     return true;
//   }

//   fail(msg: string): false {
//     this.errorMessage = msg;
//     return false;
//   }

//   onSignup() {
//     if (!this.validateForm()) return;

//     console.log('Form submitted:', {
//       role: this.role,
//       fullName: this.fullName,
//       email: this.email,
//       password: this.password,
//       contactNo: this.contactNo,
//       country: this.country,
//       status: this.status,
//       orgName: this.orgName,
//     });

//     this.router.navigate(['/login']);
//   }
// }

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
})
export class SignupComponent {
  role: string = '';
  errorMessage = '';

  constructor(private router: Router) {}

  selectRole() {
    if (!this.role) {
      this.errorMessage = 'Please select a role';
      return;
    }

    // Navigate to role-specific signup pages
    switch (this.role) {
      case 'student':
        this.router.navigate(['/signup/student']);
        break;
      case 'teacher':
        this.router.navigate(['/signup/teacher']);
        break;
      case 'admin':
        this.router.navigate(['/signup/admin']);
        break;

      default:
        this.errorMessage = 'Invalid role selected';
    }
  }
}
