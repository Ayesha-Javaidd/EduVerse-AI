import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';



@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './hero.component.html',
  styleUrls: []
})
export class HeroComponent {
  
    //Scrolls the page smoothly to the "demo" section. same as scrolltosection function used in header
     //when the "Watch Demo" button is clicked.
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
