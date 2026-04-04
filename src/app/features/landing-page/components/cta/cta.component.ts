import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';



@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './cta.component.html'
})
export class CtaComponent {
  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
  
  navigateToSignup() {
    this.router.navigate(['/signup/student']);
  }

  navigateToAdminSignup() {
    this.router.navigate(['/signup/admin']);
  }
}
