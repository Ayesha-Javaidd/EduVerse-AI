import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

export interface ContinueCourse {
  id: string;
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
  @Input() hasEnrolledCourses: boolean = false;

  constructor(private router: Router) {}

  openCourse(courseId: string) {
    this.router.navigate(['/student/learn', courseId]);
  }

  get emptyTitle(): string {
    return this.hasEnrolledCourses ? 'You are all caught up' : 'No active courses yet';
  }

  get emptyDescription(): string {
    return this.hasEnrolledCourses
      ? 'You have completed your active courses. Explore something new whenever you are ready.'
      : 'Enroll in a course to start building progress here.';
  }
}
