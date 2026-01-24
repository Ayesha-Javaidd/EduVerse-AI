import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface Course {
  title: string;
  description: string;
  image: string;
  instructor: string;
  level: string;
  duration?: string;
}

@Component({
  selector: 'app-courses-card',
  imports: [CommonModule],
  templateUrl: './courses-card.component.html',
  styleUrl: './courses-card.component.css',
})
export class CoursesCardComponent {
  @Input() recommendations: Course[] = [];

}


