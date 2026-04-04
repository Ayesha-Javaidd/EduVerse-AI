import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingpageHeaderComponent } from '../../landing-page/components/landingpage-header/landingpage-header.component';
import { FooterComponent } from '../../landing-page/components/footer/footer.component';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule, LandingpageHeaderComponent, FooterComponent],
  templateUrl: './terms-of-service.component.html',
})
export class TermsOfServiceComponent {
  lastUpdated = 'April 1, 2026';

  scrollTo(id: string) {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
}
