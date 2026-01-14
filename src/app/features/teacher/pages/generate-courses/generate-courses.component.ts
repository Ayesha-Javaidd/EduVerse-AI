import { Component, EventEmitter, Output } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { CourseService } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-generate-courses',
  imports: [
    HeaderComponent,
    ButtonComponent,
    ReactiveFormsModule,
    FormsModule,
    NgIf,
    NgFor,
  ],
  templateUrl: './generate-courses.component.html',
  styleUrl: './generate-courses.component.css',
  standalone: true
})
export class GenerateCoursesComponent {
  @Output() courseCreated = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  courseForm: FormGroup;
  isSubmitting = false;
  uploadedFiles: File[] = [];
  isDragging = false;

  categories = [
    'Mathematics',
    'Science',
    'History',
    'Language',
    'Arts',
    'Technology',
    'Business',
    'Other',
  ];

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService, // UPDATED: Injected CourseService
    private authService: AuthService      // UPDATED: Injected AuthService
  ) {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      description: [''],
    });
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        this.uploadedFiles.push(files[i]);
      }
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.uploadedFiles.push(files[i]);
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  onSubmit(): void {
    if (this.courseForm.valid) {
      const user = this.authService.getUser();
      const tenantId = this.authService.getTenantId();

      if (user && tenantId) {
        this.isSubmitting = true;

        // UPDATED: Prepare CourseCreate object for backend
        const courseData = {
          ...this.courseForm.value,
          teacherId: user.id,
          tenantId: tenantId,
          enrolledStudents: 0,
          status: 'Active',
          duration: '12 Weeks' // Placeholder
        };

        // UPDATED: Call real backend service
        this.courseService.createCourse(courseData).subscribe({
          next: (res) => {

            this.courseCreated.emit(res);
            this.isSubmitting = false;
          },
          error: (err) => {
            console.error('Course creation failed', err);
            alert(`Failed to create course: ${err.error?.detail || 'Unknown error'}`);
            this.isSubmitting = false;
          }
        });
      } else {
        alert('You must be logged in as a teacher to create courses.');
      }
    } else {
      Object.keys(this.courseForm.controls).forEach((key) => {
        this.courseForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  get title() {
    return this.courseForm.get('title');
  }
  get category() {
    return this.courseForm.get('category');
  }
}
