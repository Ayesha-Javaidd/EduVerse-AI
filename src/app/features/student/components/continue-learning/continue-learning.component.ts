import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface ContinueCourse {
  title: string;
  lesson: string;
  progress: number; // completion percentage (0–100)
}

@Component({
  selector: 'app-continue-learning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './continue-learning.component.html',
  styleUrls: ['./continue-learning.component.css'],
})
export class ContinueLearningComponent {
  @Input() courses: ContinueCourse[] = [];
}
