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
  @Input({ required: true }) totalMarks!: number; // <-- total marks of assignment

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
      console.log('Grading failed: invalid marks entered');
      return;
    }

    if (this.obtainedMarks > this.totalMarks) {
      this.errorMessage = `Obtained marks cannot exceed total marks (${this.totalMarks})`;
      console.log('Grading failed: obtained marks exceed total marks');
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
          console.log(
            `Grading successful: Submission ${this.submission.id} graded with ${this.obtainedMarks}/${this.totalMarks}`,
          );
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = 'Failed to grade submission';
          console.log(
            `Grading failed: Submission ${this.submission.id} could not be graded`,
            err,
          );
        },
      });
  }

  onClose(): void {
    this.close.emit();
  }
}
