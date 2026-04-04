import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html'
})
export class CardComponent {
  // it is for changed layout and spacing
  @Input() type: 'default' | 'feature' | 'tenant' | 'step' = 'default';

  // it is if hover animation is enabled or not
  @Input() hover = true;

  
  @Input() background: 'light' | 'dark' = 'light';

  
  @Input() class = '';

  // If true, forces equal height for grid alignment means content is less or more height should remain same
  @Input() equalHeight = false;

  
  get cardClasses(): string {
    const baseClasses = 'rounded-[18px] border border-[#e2e8f0] bg-white transition-all duration-300';
    
    const typeClasses = {
      default: 'p-8 shadow-sm',
      feature: 'p-6 shadow-sm',
      tenant: 'p-6 text-left shadow-sm',
      step: 'p-6 relative shadow-sm'
    };

    const backgroundClasses = {
      light: 'bg-white',
      dark: 'bg-[#181F39] border-[#232b45]'
    };

    const hoverClasses = this.hover ? 'hover:-translate-y-1 hover:shadow-md' : '';

    const heightClasses = this.equalHeight ? 'h-full flex flex-col' : '';

    return `${baseClasses} ${typeClasses[this.type]} ${backgroundClasses[this.background]} ${hoverClasses} ${heightClasses} ${this.class}`;
  }
}
