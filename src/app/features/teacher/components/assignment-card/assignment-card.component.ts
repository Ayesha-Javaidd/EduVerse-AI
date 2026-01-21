import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AssignmentSubmission } from '../../../../shared/models/assignment-submission.model';
@Component({
  selector: 'app-assignment-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './assignment-card.component.html',
  styleUrls: ['./assignment-card.component.css'],
})
export class AssignmentCardComponent {
  @Input() assignment: any;
  @Input() submissions: AssignmentSubmission[] = [];

  /** Card colors passed from parent */
  @Input() bgColorClass = 'bg-blue-50';
  @Input() textColorClass = 'text-blue-900';
  @Input() borderClass = 'border border-blue-200';
  @Input() buttonClass = 'bg-blue-100 text-blue-700 hover:bg-blue-200';

  @Output() onView = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();
  @Output() onInactive = new EventEmitter<void>();

  onInactiveClick() {
    this.onInactive.emit();
  }

  get submissionCount(): number {
    return this.submissions.length;
  }

  get isCompleted(): boolean {
    return new Date(this.assignment.dueDate) <= new Date();
  }
}
