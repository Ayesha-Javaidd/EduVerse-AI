import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AssignmentSubmission } from '../../../../shared/models/assignment-submission.model';
import { AssignmentService } from '../../../../shared/services/assignment.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-grade-assignment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './grade-assignment-modal.component.html',
  styleUrls: ['./grade-assignment-modal.component.css'],
})
export class GradeAssignmentModalComponent {
  @Input({ required: true }) submission!: AssignmentSubmission;

  @Output() close = new EventEmitter<void>();
  @Output() graded = new EventEmitter<AssignmentSubmission>();

  obtainedMarks: number | null = null;
  feedback = '';
  loading = false;
  errorMessage: string | null = null;

  constructor(private assignmentService: AssignmentService) {}

  submitGrade(): void {
    if (this.obtainedMarks === null || this.obtainedMarks < 0) {
      this.errorMessage = 'Please enter valid marks';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.assignmentService
      .gradeSubmission(this.submission.id, {
        obtainedMarks: this.obtainedMarks,
        feedback: this.feedback || undefined,
      })
      .subscribe({
        next: (updatedSubmission) => {
          this.loading = false;
          this.graded.emit(updatedSubmission);
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Failed to grade submission';
        },
      });
  }

  onClose(): void {
    this.close.emit();
  }
}
