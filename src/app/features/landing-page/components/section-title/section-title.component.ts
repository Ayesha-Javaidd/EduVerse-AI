import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-title',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-title.component.html',
})
export class SectionTitleComponent {
  // The actual text for the title 
  @Input() title = '';

  
  @Input() color: 'dark' | 'light' | 'blue' = 'dark';

 
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  // Compute Tailwind classes dynamically based on inputs
  get titleClasses(): string {
    const baseClasses = 'text-center font-bold tracking-tight mb-4 fade-in';
    
    const colorClasses = {
      dark: 'text-[#181F39]',
      light: 'text-white',
      blue: 'text-[#23A997]'
    };

    const sizeClasses = {
      sm: 'text-2xl md:text-3xl',
      md: 'text-3xl md:text-4xl',
      lg: 'text-4xl md:text-5xl'
    };

    return `${baseClasses} ${colorClasses[this.color]} ${sizeClasses[this.size]}`;
  }
}
