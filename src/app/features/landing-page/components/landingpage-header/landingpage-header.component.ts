import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landingpage-header',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './landingpage-header.component.html',
  styleUrl: './landingpage-header.component.css',
})
export class LandingpageHeaderComponent {
  headerOpacity = 0.85;
  mobileMenuOpen = false;

  constructor(private router: Router) {}
  // this function Listens for page scroll events .
  //As we scrolls down, the header background gets  darker.
  //but it is optional for better ui of website

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const scrolled = window.pageYOffset;

    this.headerOpacity = Math.min(0.95, 0.85 + scrolled / 1000);
  }

  //this will be Used when clicking the hamburger button on small screens.

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  // Smoothly scrolls the page to a specific section by its ID like there would be an id for every section in page.
  // like scrollToSection('features') will scroll to the Features section.

  scrollToSection(sectionId: string) {
    if (this.router.url !== '/') {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    this.mobileMenuOpen = false;
  }
  navigateToLogin() {
    this.router.navigate(['/login']);
  }
  
  navigateToSignup() {
    this.router.navigate(['/signup/student']);
  }
}
