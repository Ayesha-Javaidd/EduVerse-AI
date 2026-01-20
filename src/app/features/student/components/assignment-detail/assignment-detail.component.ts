import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Assignment } from '../../../../shared/models/assignment.model';

import { AssignmentSubmissionCreatePayload } from '../../../../shared/models/assignment-submission.model';
import { StudentAssignmentModalComponent } from '../student-assignment-modal/student-assignment-modal.component';
import { CourseService } from '../../../../shared/services/course.service';

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [CommonModule, StudentAssignmentModalComponent],
  templateUrl: './assignment-detail.component.html',
})
export class AssignmentDetailComponent implements OnInit {
  @Input() assignment!: Assignment;
  @Input() tenantId!: string; // REQUIRED for course API
  @Input() submitted = false;

  @Output() submitAssignment =
    new EventEmitter<AssignmentSubmissionCreatePayload>();
  @Output() viewFeedback = new EventEmitter<Assignment>();

  isModalOpen = false;
  courseName = 'Loading...';

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.loadCourseName();
  }

  private loadCourseName(): void {
    if (!this.assignment?.courseId || !this.tenantId) return;

    this.courseService
      .getCourseById(this.assignment.courseId, this.tenantId)
      .subscribe({
        next: (course) => {
          this.courseName = course.title ?? course.title ?? 'Unknown Course';
        },
        error: () => {
          this.courseName = 'Unknown Course';
        },
      });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  // handleSubmit(fileUrl: string): void {
  //   this.submitAssignment.emit({
  //     assignmentId: this.assignment.id,
  //     courseId: this.assignment.courseId,
  //     fileUrl,
  //   });
  //   this.closeModal();
  // }

  handleSubmit(fileUrl: string): void {
    const payload: AssignmentSubmissionCreatePayload = {
      assignmentId: this.assignment.id,
      courseId: this.assignment.courseId,
      fileUrl,
    };

    this.submitAssignment.emit(payload);
    this.closeModal();
  }

  handleViewFeedback(): void {
    this.viewFeedback.emit(this.assignment);
  }
}
