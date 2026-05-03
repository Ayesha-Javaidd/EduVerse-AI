import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Lesson } from '../../../../shared/models/course-builder.model';
import { ENDPOINTS } from '../../../../core/constants/api.constants';

@Component({
  selector: 'app-add-lesson-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-lesson-modal.component.html',
  styleUrl: './add-lesson-modal.component.css',
})
export class AddLessonModalComponent implements OnInit {
  @Input() lesson: Lesson | null = null;
  @Input() tenantId: string = '';
  @Input() teacherId: string = '';
  @Input() courseId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Lesson>>();

  title: string = '';
  content: string = '';
  isEditMode = false;
  isGeneratingDescription = false;
  descriptionError: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.lesson) {
      this.isEditMode = true;
      this.title = this.lesson.title;
      this.content = this.lesson.content || '';
    }
  }

  get isValid(): boolean {
    return this.title.trim().length >= 3 && this.content.trim().length >= 10;
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    if (!this.isValid) return;

    this.save.emit({
      title: this.title.trim(),
      type: 'document', // Always document for simplicity in this flow
      content: this.content.trim(),
    });
  }

  /** Call the backend to auto-generate the lesson description using the lesson title as the topic. */
  generateDescription(): void {
    const topic = this.title.trim();
    if (topic.length < 3 || this.isGeneratingDescription) return;

    this.isGeneratingDescription = true;
    this.descriptionError = null;

    this.http
      .post<{ status: string; lesson_description?: string; message?: string }>(
        ENDPOINTS.REFERENCE.GENERATE_DESCRIPTION,
        {
          topic,
          tenant_id: this.tenantId,
          course_id: this.courseId,
          lesson_id: null,
        }
      )
      .subscribe({
        next: (res) => {
          this.isGeneratingDescription = false;
          if (res.status === 'success' && res.lesson_description) {
            this.content = res.lesson_description;
          } else {
            this.descriptionError =
              res.message ??
              'No reference material found for this course. Upload a reference file first, or write the description manually.';
          }
        },
        error: () => {
          this.isGeneratingDescription = false;
          this.descriptionError =
            'AI generation failed. Please try again or write the description manually.';
        },
      });
  }
}
