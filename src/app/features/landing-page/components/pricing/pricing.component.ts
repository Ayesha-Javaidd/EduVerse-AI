import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../section-title/section-title.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { Router } from '@angular/router';

interface PricingTier {
  name: string;
  monthlyPrice: number; 
  description: string;
  features: string[];
  highlighted?: boolean;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent, ButtonComponent],
  templateUrl: './pricing.component.html'
})
export class PricingComponent {
  isYearly = false;

  tiers: PricingTier[] = [
    {
      name: 'Starter',
      monthlyPrice: 0,
      description: 'Perfect for small coaching centers and independent teachers.',
      features: [
        'Up to 500 active students',
        'Basic course builder',
        'Standard AI assistant',
        'Email support'
      ]
    },
    {
      name: 'Professional',
      monthlyPrice: 49,
      description: 'Ideal for growing schools and specialized training centers.',
      highlighted: true,
      features: [
        'Up to 5,000 active students',
        'Advanced course builder & SCORM',
        'LangChain powered personalized AI',
        'Priority 24/7 support',
        'Custom domain setup'
      ]
    },
    {
      name: 'Enterprise',
      monthlyPrice: 149,
      description: 'For universities and large corporate training portals.',
      features: [
        'Unlimited students',
        'Full multi-tenant architecture',
        'Custom LLM model fine-tuning',
        'Dedicated account manager',
        'SSO and advanced integrations'
      ]
    }
  ];

  constructor(private router: Router) {}

  toggleBilling() {
    this.isYearly = !this.isYearly;
  }

  navigateToAdminSignup() {
    this.router.navigate(['/signup/admin']);
  }
}
