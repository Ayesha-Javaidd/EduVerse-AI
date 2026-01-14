import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

export interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail?: string;
  image?: string;
  progress?: number;
  duration?: string;
  lessonsCompleted?: number;
  totalLessons?: number;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating?: number;
  nextLesson?: string;
  dueDate?: string;
  description?: string;
  price?: number;
  enrolledStudents?: number;
}

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.css']
})
export class CourseCardComponent {
  @Input() course!: Course;
  @Input() variant: 'enrolled' | 'explore' = 'enrolled'; 
  @Input() showEnrollButton: boolean = false;
  
  @Output() courseClick = new EventEmitter<Course>();
  @Output() enrollClick = new EventEmitter<Course>();

  // Get image source (supports both thumbnail and image properties)
  get imageSource(): string {
    return this.course.image || this.course.thumbnail || 'assets/images/default-course.jpg';
  }

  // Check if this is an enrolled course (has progress data)
  get isEnrolledCourse(): boolean {
    return this.variant === 'enrolled' && this.course.progress !== undefined;
  }

  onCourseClick() {
    this.courseClick.emit(this.course);
  }

  onEnrollClick(event: Event) {
    event.stopPropagation();
    this.enrollClick.emit(this.course);
  }

  get levelColor(): string {
    switch (this.course.level) {
      case 'Beginner': return 'bg-teal-500';
      case 'Intermediate': return 'bg-violet-500';
      case 'Advanced': return 'bg-rose-500';
      default: return 'bg-gray-500';
    }
  }

  get levelBadgeClass(): string {
    switch (this.course.level) {
      case 'Beginner': return 'bg-teal-100 text-teal-700';
      case 'Intermediate': return 'bg-violet-100 text-violet-700';
      case 'Advanced': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  get progressColor(): string {
    const progress = this.course.progress || 0;
    if (progress >= 75) return 'bg-teal-500';
    if (progress >= 50) return 'bg-cyan-500';
    if (progress >= 25) return 'bg-violet-500';
    return 'bg-gray-400';
  }

  get progressStrokeColor(): string {
    const progress = this.course.progress || 0;
    if (progress >= 75) return '#14b8a6';
    if (progress >= 50) return '#06b6d4';
    if (progress >= 25) return '#8b5cf6';
    return '#9ca3af';
  }
}
