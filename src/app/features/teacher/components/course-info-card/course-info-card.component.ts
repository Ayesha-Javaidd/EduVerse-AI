import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseBuilderData } from '../../../../shared/models/course-builder.model';

@Component({
  selector: 'app-course-info-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-info-card.component.html',
  styleUrl: './course-info-card.component.css',
})
export class CourseInfoCardComponent {
  @Input() course!: CourseBuilderData;
  @Output() editClick = new EventEmitter<void>();

  get moduleCount(): number {
    return this.course?.modules?.length || 0;
  }

  get lessonCount(): number {
    return this.course?.totalLessons || 0;
  }

  onEditClick(): void {
    this.editClick.emit();
  }
}
