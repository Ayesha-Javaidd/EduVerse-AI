import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Lesson } from '../../../../shared/models/course-builder.model';
import { QuizService } from '../../services/quiz.service';
import { Quiz } from '../../../../shared/models/quiz.model';

interface QuizOption {
  id: string;
  title: string;
  questionsCount: number;
}

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
  @Input() courseId: string = ''; // Filter quizzes by this course
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Lesson>>();

  @ViewChild('documentContent') documentContentRef!: ElementRef<HTMLTextAreaElement>;

  title: string = '';
  type: 'video' | 'document' | 'quiz' = 'video';
  duration: string = '';
  content: string = '';
  
  // Document options
  documentInputMode: 'write' | 'upload' = 'write';
  documentUrl: string = '';
  
  // Quiz options
  availableQuizzes: QuizOption[] = [];
  selectedQuizId: string = '';
  isLoadingQuizzes = false;

  isEditMode = false;

  lessonTypes = [
    { value: 'video' as const, label: 'Video', icon: 'video' },
    { value: 'document' as const, label: 'Document', icon: 'document' },
    { value: 'quiz' as const, label: 'Quiz', icon: 'quiz' },
  ];

  constructor(private quizService: QuizService) {}

  ngOnInit(): void {
    if (this.lesson) {
      this.isEditMode = true;
      this.title = this.lesson.title;
      this.type = this.lesson.type;
      this.duration = this.lesson.duration || '';
      this.content = this.lesson.content || '';
      
      // If quiz, set selected quiz ID
      if (this.type === 'quiz') {
        this.selectedQuizId = this.content;
      }
      
      // If document with URL, set upload mode
      if (this.type === 'document' && this.content.startsWith('http')) {
        this.documentInputMode = 'upload';
        this.documentUrl = this.content;
      }
    }
    
    // Load quizzes for dropdown
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    if (!this.tenantId) return;
    
    this.isLoadingQuizzes = true;
    
    // Build params - filter by courseId if available
    const params: any = { tenant_id: this.tenantId };
    if (this.courseId) {
      params.course_id = this.courseId;
    }
    
    this.quizService.getQuizzes(params).subscribe({
      next: (quizzes) => {
        this.availableQuizzes = quizzes.map((q: Quiz) => ({
          id: q.id || (q as any)._id,
          title: `Quiz ${q.quizNumber}${q.description ? ': ' + q.description : ''}`,
          questionsCount: q.questions?.length || 0
        }));
        this.isLoadingQuizzes = false;
      },
      error: () => {
        this.isLoadingQuizzes = false;
      }
    });
  }

  setType(value: 'video' | 'document' | 'quiz'): void {
    this.type = value;
    // Reset content when type changes
    this.content = '';
    this.selectedQuizId = '';
    this.documentUrl = '';
    this.documentInputMode = 'write';
  }

  setDocumentMode(mode: 'write' | 'upload'): void {
    this.documentInputMode = mode;
    // Clear content when switching modes
    this.content = '';
    this.documentUrl = '';
  }

  get isValid(): boolean {
    if (this.title.trim().length < 3) return false;
    
    // Content is required based on type
    if (this.type === 'video' && !this.content.trim()) return false;
    if (this.type === 'quiz' && !this.selectedQuizId) return false;
    if (this.type === 'document') {
      if (this.documentInputMode === 'write' && !this.content.trim()) return false;
      if (this.documentInputMode === 'upload' && !this.documentUrl.trim()) return false;
    }
    
    return true;
  }

  get durationValid(): boolean {
    if (!this.duration) return true;
    // Validate MM:SS format
    const regex = /^([0-5]?[0-9]):([0-5][0-9])$/;
    return regex.test(this.duration);
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  // Rich text formatting helpers (HTML-based for WYSIWYG)
  applyFormat(format: string): void {
    const textarea = this.documentContentRef?.nativeElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.content.substring(start, end) || 'text';
    
    let formattedText = '';
    let cursorOffset = 0;
    
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`;
        cursorOffset = 8; // <strong>
        break;
      case 'italic':
        formattedText = `<em>${selectedText}</em>`;
        cursorOffset = 4; // <em>
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        cursorOffset = 3; // <u>
        break;
      case 'heading':
        formattedText = `<h2>${selectedText}</h2>\n`;
        cursorOffset = 4; // <h2>
        break;
      case 'bullet':
        formattedText = `<ul>\n  <li>${selectedText}</li>\n</ul>\n`;
        cursorOffset = 12; // <ul>\n  <li>
        break;
      case 'numbered':
        formattedText = `<ol>\n  <li>${selectedText}</li>\n</ol>\n`;
        cursorOffset = 12; // <ol>\n  <li>
        break;
      case 'link':
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          formattedText = `<a href="${url}">${selectedText}</a>`;
        } else {
          formattedText = selectedText;
        }
        break;
      default:
        formattedText = selectedText;
    }
    
    this.content = this.content.substring(0, start) + formattedText + this.content.substring(end);
    
    // Restore focus and cursor position after a brief delay
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + cursorOffset + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  onSave(): void {
    if (!this.isValid || !this.durationValid) return;

    let finalContent = this.content.trim();
    
    // For quiz, use selected quiz ID
    if (this.type === 'quiz') {
      finalContent = this.selectedQuizId;
    }
    
    // For document with URL, use the URL
    if (this.type === 'document' && this.documentInputMode === 'upload') {
      finalContent = this.documentUrl.trim();
    }

    this.save.emit({
      title: this.title.trim(),
      type: this.type,
      duration: this.duration.trim(),
      content: finalContent,
    });
  }
}
