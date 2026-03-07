import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';
import { CourseService } from '../../../../core/services/course.service';

@Component({
  selector: 'app-student-assignment-modal',
  standalone: true,
  imports: [CommonModule, ModalShellComponent],
  templateUrl: './student-assignment-modal.component.html',
})
export class StudentAssignmentModalComponent {
  @Input() show = false;
  @Input() assignment: any;
  @Input() tenantId: any;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<string>();

  selectedFile: File | null = null;

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.loadCourseName();
  }
  courseName: string = '';

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

  // When a file is selected
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('File selected:', file.name, file.size, 'bytes');
    }
  }

  // Submit the assignment
  submitAssignment(): void {
    if (!this.selectedFile) {
      console.warn('No file selected, cannot submit.');
      return;
    }

    const fakeFileUrl = `uploads/${this.selectedFile.name}`;
    console.log(
      'Submitting assignment:',
      this.assignment?.title,
      'File URL:',
      fakeFileUrl,
    );
    this.submit.emit(fakeFileUrl);

    // Close modal after submit
    this.closeModal();
  }

  // Close modal
  closeModal(): void {
    console.log('Closing modal for assignment:', this.assignment?.title);
    this.selectedFile = null;
    this.close.emit();
  }

  // Remove selected file
  removeFile(): void {
    if (this.selectedFile) {
      console.log('Removing selected file:', this.selectedFile.name);
    }
    this.selectedFile = null;
  }

  // Whether form is valid (file selected)
  get isFormValid(): boolean {
    const valid = !!this.selectedFile;
    console.log('Checking if form is valid:', valid);
    return valid;
  }
}
