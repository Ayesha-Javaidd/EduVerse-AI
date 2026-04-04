import { Component, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationService } from './services/animation.service';
import { HeroComponent } from './components/hero/hero.component';
import { TenantSectionComponent } from './components/tenant-section/tenant-section.component';
import { AiDemoComponent } from './components/ai-demo/ai-demo.component';
import { FeaturesComponent } from './components/features/features.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { CtaComponent } from './components/cta/cta.component';
import { FooterComponent } from './components/footer/footer.component';
import { LandingpageHeaderComponent } from './components/landingpage-header/landingpage-header.component';
import { PricingComponent } from './components/pricing/pricing.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    TenantSectionComponent,
    AiDemoComponent,
    FeaturesComponent,
    HowItWorksComponent,
    PricingComponent,
    CtaComponent,
    FooterComponent,
    LandingpageHeaderComponent,
  ],

  templateUrl: './landing-page.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./landing-page.component.css'],
})
export class LandingPageComponent implements AfterViewInit, OnDestroy {
  title = 'eduverse-ai-platform';

  constructor(private animationService: AnimationService) {}

  ngAfterViewInit() {
    // We delay slightly to ensure all child component views are fully rendered and elements are in the DOM before querying.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.animationService.initScrollAnimations();
      });
    });
  }

  ngOnDestroy() {
    this.animationService.destroy();
  }
}
