import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-create-assignment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-assignment.component.html',
  styleUrls: ['./create-assignment.component.css'],
})
export class CreateAssignmentComponent implements OnInit {
  @Input() assignment: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  assignmentForm!: FormGroup;
  isEditMode = false;

  courses = [
    'Advanced Web Development',
    'Database Management Systems',
    'Frontend Development',
    'Backend Development',
    'Mobile App Development',
    'Web Technologies',
    'Database Systems'
  ];

  attachments: File[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();

    if (this.assignment) {
      this.isEditMode = true;
      this.populateFormWithAssignmentData(this.assignment);
    }
  }

  initForm(): void {
    this.assignmentForm = this.fb.group({
      id: [null],
      title: ['', Validators.required],
      course: ['', Validators.required],
      description: ['', Validators.required],
      dueDate: ['', Validators.required],
      dueTime: ['', Validators.required],
      totalMarks: ['', [Validators.required, Validators.min(1)]],
      passingMarks: ['', [Validators.required, Validators.min(1)]],
      allowLateSubmission: [false],
      submitted: [0],
      totalStudents: [50],
      status: ['active'],
    }, { validators: this.passingMarksValidator });
  }

  // Custom validator to ensure passing marks <= total marks
  passingMarksValidator(group: FormGroup) {
    const totalMarks = group.get('totalMarks')?.value;
    const passingMarks = group.get('passingMarks')?.value;
    
    if (totalMarks && passingMarks && parseInt(passingMarks) > parseInt(totalMarks)) {
      return { passingMarksExceeded: true };
    }
    return null;
  }

  populateFormWithAssignmentData(assignmentData: any): void {
    this.assignmentForm.patchValue({
      id: assignmentData.id,
      title: assignmentData.title,
      course: assignmentData.course,
      description: assignmentData.description,
      dueDate: assignmentData.dueDate,
      dueTime: assignmentData.dueTime,
      totalMarks: assignmentData.totalMarks,
      passingMarks: assignmentData.passingMarks,
      allowLateSubmission: assignmentData.allowLateSubmission,
      submitted: assignmentData.submitted,
      totalStudents: assignmentData.totalStudents,
      status: assignmentData.status,
    });
  }

  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.attachments = [...this.attachments, ...Array.from(input.files)];
    }
  }

  removeAttachment(index: number): void {
    this.attachments = this.attachments.filter((_, i) => i !== index);
  }

  closeModal(): void {
    this.close.emit();
  }

  saveAssignment(): void {
    if (this.assignmentForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    if (this.assignmentForm.errors?.['passingMarksExceeded']) {
      alert('Passing marks cannot be greater than total marks.');
      return;
    }

    const formValue = this.assignmentForm.getRawValue();
    
    // Add ID if creating new
    if (!formValue.id) {
      formValue.id = Date.now();
    }

    this.save.emit(formValue);
  }
}
