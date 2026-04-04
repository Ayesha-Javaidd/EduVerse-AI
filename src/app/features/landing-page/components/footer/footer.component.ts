import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface FooterLink {
  label: string;
  action: string; // 'scroll:sectionId' or 'route:/path'
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  constructor(private router: Router) {}

  footerSections: FooterSection[] = [
    {
      title: 'Platform',
      links: [
        { label: 'Multi-Tenant Architecture', action: 'scroll:platform' },
        { label: 'LangChain & LLM Integration', action: 'scroll:ai' },
        { label: 'Personalized Delivery', action: 'scroll:features' },
        { label: 'Pricing Plans', action: 'scroll:pricing' }
      ]
    },
    {
      title: 'Solutions',
      links: [
        { label: 'For Institutions', action: 'route:/signup/admin' },
        { label: 'For Educators', action: 'scroll:workflow' },
        { label: 'For Students', action: 'route:/signup/student' },
        { label: 'Custom Enterprise', action: 'scroll:pricing' }
      ]
    },
    {
      title: 'Legal & Support',
      links: [
        { label: 'Help Center', action: 'route:/help-center' },
        { label: 'Documentation', action: 'route:/documentation' },
        { label: 'Privacy Policy', action: 'route:/privacy-policy' },
        { label: 'Terms of Service', action: 'route:/terms-of-service' }
      ]
    }
  ];

  currentYear = new Date().getFullYear();

  onLinkClick(action: string): void {
    if (action.startsWith('scroll:')) {
      const sectionId = action.replace('scroll:', '');
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (action.startsWith('route:')) {
      const route = action.replace('route:', '');
      this.router.navigate([route]);
    }
  }
}
