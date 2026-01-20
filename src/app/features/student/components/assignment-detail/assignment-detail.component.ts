import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Assignment } from '../../../../shared/models/assignment.model';
import { AssignmentSubmissionCreatePayload } from '../../../../shared/models/assignment-submission.model';
import { StudentAssignmentModalComponent } from '../student-assignment-modal/student-assignment-modal.component';

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [CommonModule, StudentAssignmentModalComponent],
  templateUrl: './assignment-detail.component.html',
})
export class AssignmentDetailComponent {
  @Input() assignment!: Assignment & {
    submitted?: boolean;
    effectiveStatus?: string;
  };
  @Input() tenantId!: string;
  @Input() submitted = false;

  @Output() submitAssignment =
    new EventEmitter<AssignmentSubmissionCreatePayload>();
  @Output() viewFeedback = new EventEmitter<Assignment>();

  isModalOpen = false;

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

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

  // Computed properties for template
  get isActive(): boolean {
    return this.assignment.effectiveStatus === 'active';
  }

  get isSubmitted(): boolean {
    return this.assignment.submitted === true;
  }

  get cardClasses(): string {
    if (this.isSubmitted) return 'border-blue-400 bg-blue-50'; // Blue for submitted
    if (this.assignment.effectiveStatus === 'active')
      return 'border-purple-400 bg-purple-50';
    if (this.assignment.effectiveStatus === 'graded')
      return 'border-green-400 bg-green-50';
    return '';
  }
}
