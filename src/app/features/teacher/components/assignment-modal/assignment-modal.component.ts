import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  Validators,
  FormArray,
  ReactiveFormsModule,
} from '@angular/forms';
import { Course } from '../../../../shared/models/course.model';
import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-assignment-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalShellComponent,
    ButtonComponent,
  ],
  templateUrl: './assignment-modal.component.html',
  styleUrls: ['./assignment-modal.component.css'],
})
export class AssignmentModalComponent implements OnInit {
  @Input() show = false;
  @Input() courses: Course[] = [];
  @Input() editingAssignmentId: string | null = null;
  @Input() formData: any = {};
  @Input() currentTeacherId!: string; // required by backend
  @Input() currentTenantId!: string; // required by backend

  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<any>();

  assignmentForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    console.log('Initializing form with data:', this.formData);

    this.assignmentForm = new FormGroup({
      title: new FormControl(this.formData.title || '', Validators.required),
      courseId: new FormControl(
        this.formData.courseId || '',
        Validators.required,
      ),
      description: new FormControl(
        this.formData.description || '',
        Validators.required,
      ),

      dueDate: new FormControl(
        this.formData.dueDate || '',
        Validators.required,
      ),
      dueTime: new FormControl(
        this.formData.dueTime || '',
        Validators.required,
      ),

      totalMarks: new FormControl(this.formData.totalMarks || 100, [
        Validators.required,
        Validators.min(1),
        Validators.max(100),
      ]),
      passingMarks: new FormControl(this.formData.passingMarks || 50, [
        Validators.required,
        Validators.min(0),
      ]),

      allowLateSubmission: new FormControl(
        this.formData.allowLateSubmission || false,
      ),
      attachments: new FormArray([]),
    });
  }

  get attachments(): FormArray {
    return this.assignmentForm.get('attachments') as FormArray;
  }

  submitForm(): void {
    if (!this.assignmentForm.valid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    const value = this.assignmentForm.value;

    // Combine dueDate and dueTime into single ISO datetime string
    const dueDateTime = new Date(
      `${value.dueDate}T${value.dueTime}:00`,
    ).toISOString();

    // Normalize payload to match backend schema
    const payload = {
      title: value.title,
      description: value.description,
      courseId: value.courseId,

      dueDate: dueDateTime,
      totalMarks: Number(value.totalMarks),
      passingMarks: Number(value.passingMarks),
      status: 'active', // default status
      fileUrl: value.attachments?.[0]?.name || null, // first file name or null
      allowedFormats: ['pdf', 'docx'], // default
      allowLateSubmission: Boolean(value.allowLateSubmission),
      // attachments: value.attachments.map((file: File) => file.name), // or upload separately
    };

    console.log('Submitting payload:', payload);
    this.onSubmit.emit(payload);
  }

  closeModal(): void {
    this.onClose.emit();
  }

  handleFileUpload(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target.files) return;

    Array.from(target.files).forEach((file) => {
      this.attachments.push(new FormControl(file));
    });

    target.value = '';
  }

  removeAttachment(index: number): void {
    this.attachments.removeAt(index);
  }
}
