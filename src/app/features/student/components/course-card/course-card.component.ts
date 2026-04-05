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
  nextLesson?: string;
  description?: string;
  price?: number;
  enrolledStudents?: number;
  tenantId?: string;
  variant?: 'enrolled' | 'explore';
}

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './course-card.component.html'
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

  get isCompletedCourse(): boolean {
    return (this.course.progress || 0) >= 100;
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
      case 'Beginner': return 'bg-[#23A997]';
      case 'Intermediate': return 'bg-[#181F39]';
      case 'Advanced': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  }

  get levelBadgeClass(): string {
    switch (this.course.level) {
      case 'Beginner': return 'bg-[#ecf9f6] text-[#1b8c7d]';
      case 'Intermediate': return 'bg-slate-100 text-slate-700';
      case 'Advanced': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  get progressColor(): string {
    const progress = this.course.progress || 0;
    if (progress >= 75) return 'bg-[#23A997]';
    if (progress >= 50) return 'bg-[#34b8a8]';
    if (progress >= 25) return 'bg-slate-400';
    return 'bg-slate-300';
  }

  get progressStrokeColor(): string {
    const progress = this.course.progress || 0;
    if (progress >= 75) return '#23A997';
    if (progress >= 50) return '#34b8a8';
    if (progress >= 25) return '#94a3b8';
    return '#cbd5e1';
  }

  get actionLabel(): string {
    if (this.isCompletedCourse) return 'Review Course';
    if ((this.course.progress || 0) === 0) return 'Start Course';
    return 'Continue';
  }
}
