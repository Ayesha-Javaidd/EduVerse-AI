import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Course } from '../../../../shared/models/course.model';
import { AssignmentCreate } from '../../../../shared/models/assignment.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';

@Component({
  selector: 'app-assignment-modal',
  templateUrl: './assignment-modal.component.html',
  styleUrls: ['./assignment-modal.component.css'],
  imports: [
    ButtonComponent,
    ModalShellComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class AssignmentModalComponent implements OnInit {
  @Input() show = false;
  @Input() editingAssignmentId: string | null = null;
  @Input() formData: Partial<AssignmentCreate> = {};
  @Input() courses: Course[] = [];

  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<AssignmentCreate>();

  assignmentForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.assignmentForm = this.fb.group({
      title: [this.formData.title || '', Validators.required],
      courseId: [this.formData.courseId || '', Validators.required],
      description: [this.formData.description || '', Validators.required],
      dueDate: [
        this.formData.dueDate ? this.formData.dueDate.split('T')[0] : '',
        Validators.required,
      ],
      dueTime: [
        this.formData.dueDate
          ? this.formData.dueDate.split('T')[1]?.slice(0, 5)
          : '',
        Validators.required,
      ],
      totalMarks: [
        this.formData.totalMarks || '',
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      passingMarks: [
        this.formData.passingMarks || '',
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      allowLateSubmission: [this.formData.allowLateSubmission || false],
      attachments: this.fb.array([]),
    });

    // Validate passingMarks <= totalMarks
    this.assignmentForm
      .get('passingMarks')
      ?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(100),
        this.passingGreaterThanTotal.bind(this),
      ]);
  }

  // Access attachments form array
  get attachments(): FormArray {
    return this.assignmentForm.get('attachments') as FormArray;
  }

  // Custom validator: passingMarks <= totalMarks
  passingGreaterThanTotal(control: any) {
    if (!this.assignmentForm) return null;
    const total = this.assignmentForm.get('totalMarks')?.value;
    return control.value > total ? { passingGreaterThanTotal: true } : null;
  }

  submitForm(): void {
    if (this.assignmentForm.invalid) return;

    const formValue = this.assignmentForm.value;

    // Combine date + time into single ISO string
    const dueDateTime = new Date(`${formValue.dueDate}T${formValue.dueTime}`);

    const assignmentData: AssignmentCreate = {
      ...formValue,
      totalMarks: +formValue.totalMarks,
      passingMarks: +formValue.passingMarks,
      dueDate: dueDateTime.toISOString(),
      attachments: formValue.attachments,
    };

    this.onSubmit.emit(assignmentData);
  }

  closeModal(): void {
    this.onClose.emit();
    this.assignmentForm.reset();
    while (this.attachments.length) {
      this.attachments.removeAt(0);
    }
  }

  handleFileUpload(event: any) {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      this.attachments.push(this.fb.control(files[i]));
    }
  }

  removeAttachment(index: number) {
    this.attachments.removeAt(index);
  }
}
