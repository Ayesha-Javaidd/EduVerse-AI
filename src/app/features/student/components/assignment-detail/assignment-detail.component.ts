import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Assignment } from '../../../../shared/models/assignment.model';
import {
  AssignmentSubmission,
  AssignmentSubmissionCreatePayload,
} from '../../../../shared/models/assignment-submission.model';
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
  @Input() submission?: AssignmentSubmission;

  @Output() submitAssignment =
    new EventEmitter<AssignmentSubmissionCreatePayload>();

  isModalOpen = false;
  feedbackModalOpen = false;

  // Feedback message from submission
  get feedbackMessage(): string {
    return this.submission?.feedback || 'No feedback provided.';
  }

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
    if (this.submission) {
      this.feedbackModalOpen = true;
    } else {
      console.error('No submission found for this assignment.');
    }
  }

  closeFeedbackModal(): void {
    this.feedbackModalOpen = false;
  }

  get cardClasses(): string {
    if (!this.assignment.effectiveStatus) return 'bg-white border-gray-200';

    switch (this.assignment.effectiveStatus) {
      case 'graded':
        return 'bg-green-50 border-green-400 text-green-900';
      case 'submitted':
        return 'bg-blue-50 border-blue-400 text-blue-900';
      case 'active':
      default:
        return 'bg-purple-50 border-purple-400 text-purple-900';
    }
  }

  get isActive(): boolean {
    return this.assignment.effectiveStatus === 'active';
  }

  get isSubmitted(): boolean {
    return this.assignment.effectiveStatus === 'submitted';
  }
}
