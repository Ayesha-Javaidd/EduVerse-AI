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
      case 'admin':
        this.router.navigate(['/signup/admin']);
        break;

      default:
        this.errorMessage = 'Invalid role selected';
    }
  }
}
