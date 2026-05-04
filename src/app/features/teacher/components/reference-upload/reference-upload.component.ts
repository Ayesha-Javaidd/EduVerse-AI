import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ENDPOINTS } from '../../../../core/constants/api.constants';

// ── Exported interface — used by course-builder.component.ts ─────────────────

export interface GeneratedLesson {
  lesson_number: number;
  title: string;
  summary: string;
  objectives: string[];
  key_concepts: string[];
  estimated_duration_minutes: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-reference-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reference-upload-container">

      <!-- ── Guidance Banner ── -->
      <div class="guidance-banner">
        <span class="banner-icon">💡</span>
        <div>
          <strong>Best Results:</strong> For large books, upload one chapter at a time.
          This gives the AI focused context and produces better lesson quality.
        </div>
      </div>

      <!-- ── Chapter Tag Input ── -->
      <div class="form-group">
        <label class="field-label">
          Chapter or Section Name
          <span class="optional">(recommended)</span>
        </label>
        <input
          id="chapter-tag-input"
          type="text"
          [(ngModel)]="chapterTag"
          placeholder="e.g. Chapter 1 — Laws of Motion"
          class="text-input"
          [disabled]="uploadStatus === 'uploading' || uploadStatus === 'processing'"
        />
        <small class="field-hint">
          Helps the AI understand what part of the course this material covers.
        </small>
      </div>

      <!-- ── Drop Zone (shown when idle or failed) ── -->
      <div
        *ngIf="uploadStatus === 'idle' || uploadStatus === 'failed'"
        id="reference-drop-zone"
        class="drop-zone"
        (dragover)="$event.preventDefault()"
        (dragleave)="isDragging = false"
        (dragenter)="isDragging = true"
        (drop)="onFileDrop($event)"
        (click)="fileInput.click()"
        [class.drag-over]="isDragging"
      >
        <input
          #fileInput
          type="file"
          accept=".pdf,.pptx,.docx"
          hidden
          (change)="onFileSelected($event)"
        />
        <div class="drop-zone-content">
          <div class="drop-icon">📄</div>
          <p class="drop-primary">Drag and drop your reference file here</p>
          <p class="drop-secondary">or click to browse</p>
          <p class="drop-formats">PDF · PPTX · DOCX · Max 50 MB</p>
        </div>
      </div>

      <!-- ── Error Banner ── -->
      <div *ngIf="uploadError" class="error-banner">
        ⚠️ {{ uploadError }}
      </div>

      <!-- ── Uploading State ── -->
      <div *ngIf="uploadStatus === 'uploading'" class="status-card uploading">
        <div class="spinner"></div>
        <div class="status-text">
          <strong>Uploading {{ uploadedFileName }}…</strong>
          <p>Saving your file securely to the server.</p>
        </div>
      </div>

      <!-- ── Processing State ── -->
      <div *ngIf="uploadStatus === 'processing'" class="status-card processing">
        <div class="spinner"></div>
        <div class="status-text">
          <strong>Processing {{ uploadedFileName }}…</strong>
          <p>AI is reading and indexing your reference material.
             This may take 1–3 minutes for large files.</p>
        </div>
      </div>

      <!-- ── Done State ── -->
      <div *ngIf="uploadStatus === 'done'" class="status-card done">
        <div class="check-icon">✅</div>
        <div class="status-text">
          <strong>{{ uploadedFileName }} is ready</strong>
          <p>{{ chunkCount }} content chunks indexed and ready for lesson generation.</p>
        </div>
      </div>

      <!-- ── Generate Lessons Button (only when done) ── -->
      <div *ngIf="uploadStatus === 'done'" class="generate-section">
        <button
          id="generate-course-lessons-btn"
          class="btn-generate"
          (click)="generateCourseLessons()"
          [disabled]="generating"
        >
          <ng-container *ngIf="!generating">
            🤖 Generate Full Course Lessons
          </ng-container>
          <ng-container *ngIf="generating">
            <span class="spinner-sm"></span>
            AI is planning your lessons… this takes 1–2 minutes
          </ng-container>
        </button>

        <!-- Validation result badge -->
        <div
          *ngIf="validationVerdict"
          class="validation-result"
          [class.review]="validationVerdict === 'REVIEW'"
          [class.pass]="validationVerdict === 'PASS'"
        >
          <strong>Quality Score: {{ validationScore }}/100</strong>
          <span class="verdict-badge">{{ validationVerdict }}</span>
          <p *ngIf="validationVerdict === 'REVIEW'" class="verdict-note">
            Lessons generated but scored below 75. Review carefully before publishing.
          </p>
        </div>

        <!-- Generation error -->
        <div *ngIf="generationError" class="error-banner">
          ⚠️ {{ generationError }}
        </div>
      </div>

    </div>
  `,
  styles: [`
    .reference-upload-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* ── Guidance Banner ── */
    .guidance-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 0.875rem 1rem;
      font-size: 0.875rem;
      color: #1e40af;
    }
    .banner-icon { font-size: 1.1rem; flex-shrink: 0; }

    /* ── Form group ── */
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .field-label { font-size: 0.875rem; font-weight: 600; color: #181F39; }
    .optional { font-weight: 400; color: #64748b; margin-left: 0.25rem; }
    .text-input {
      height: 44px;
      border: 1px solid #dbe4ea;
      border-radius: 10px;
      padding: 0 0.875rem;
      font-size: 0.875rem;
      color: #181F39;
      background: #f8fafc;
      transition: border-color 0.15s, box-shadow 0.15s;
      outline: none;
    }
    .text-input:focus { border-color: #23A997; box-shadow: 0 0 0 3px rgba(35,169,151,0.15); }
    .text-input:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
    .field-hint { font-size: 0.78rem; color: #64748b; }

    /* ── Drop Zone ── */
    .drop-zone {
      border: 2px dashed #cbd5e1;
      border-radius: 14px;
      padding: 2.5rem 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: #fafbfc;
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: #23A997;
      background: #f0faf9;
    }
    .drop-zone-content { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
    .drop-icon { font-size: 2.5rem; }
    .drop-primary { font-weight: 600; color: #181F39; margin: 0; }
    .drop-secondary { color: #64748b; font-size: 0.875rem; margin: 0; }
    .drop-formats { font-size: 0.8rem; color: #94a3b8; margin: 0; }

    /* ── Status Cards ── */
    .status-card {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      border: 1px solid;
    }
    .status-card.uploading {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1e40af;
    }
    .status-card.processing {
      background: #fefce8;
      border-color: #fde68a;
      color: #92400e;
    }
    .status-card.done {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }
    .status-text { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.875rem; }
    .status-text p { margin: 0; }
    .check-icon { font-size: 1.4rem; flex-shrink: 0; }

    /* ── Spinner ── */
    .spinner {
      width: 22px;
      height: 22px;
      border: 3px solid rgba(0,0,0,0.12);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    .spinner-sm {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-right: 0.4rem;
      vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Error Banner ── */
    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: #991b1b;
    }

    /* ── Generate Section ── */
    .generate-section { display: flex; flex-direction: column; gap: 0.875rem; }
    .btn-generate {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #23A997, #1b8c7d);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
      box-shadow: 0 8px 24px rgba(35,169,151,0.25);
    }
    .btn-generate:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
    .btn-generate:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    /* ── Validation Result ── */
    .validation-result {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: #166534;
    }
    .validation-result.review {
      background: #fefce8;
      border-color: #fde68a;
      color: #92400e;
    }
    .verdict-badge {
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      background: currentColor;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(0,0,0,0.15);
    }
    .verdict-note { width: 100%; margin: 0; font-size: 0.82rem; }
  `],
})
export class ReferenceUploadComponent implements OnInit, OnDestroy {
  // ── Inputs from parent (course-builder) ───────────────────────────────────
  @Input() courseId: string = '';
  @Input() tenantId: string = '';
  @Input() courseTitle: string = '';
  @Input() lessonId: string = '';  // kept for backward compat

  // ── Output — emitted when AI successfully generates lessons ───────────────
  @Output() courseLessonsGenerated = new EventEmitter<GeneratedLesson[]>();

  // ── Upload state ──────────────────────────────────────────────────────────
  chapterTag: string = '';
  isDragging: boolean = false;
  uploadStatus: 'idle' | 'uploading' | 'processing' | 'done' | 'failed' = 'idle';
  uploadId: string = '';
  uploadedFileName: string = '';
  chunkCount: number = 0;
  uploadError: string = '';

  // ── Generation state ──────────────────────────────────────────────────────
  generating: boolean = false;
  generationError: string = '';
  validationScore: number = 0;
  validationVerdict: string = '';

  private pollSubscription?: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Nothing to pre-load — the teacher starts by uploading a file
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  // ── File selection ────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.startUpload(input.files[0]);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.startUpload(file);
  }

  // ── Upload orchestration ──────────────────────────────────────────────────

  private startUpload(file: File): void {
    // Client-side validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'pptx', 'docx'].includes(ext || '')) {
      this.uploadError = `File type '.${ext}' is not supported. Please upload PDF, PPTX, or DOCX files only.`;
      this.uploadStatus = 'failed';
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 50) {
      this.uploadError = `File is ${sizeMb.toFixed(1)} MB. Maximum is 50 MB. Please split into chapters and upload separately.`;
      this.uploadStatus = 'failed';
      return;
    }

    // Reset state
    this.uploadError = '';
    this.generationError = '';
    this.validationVerdict = '';
    this.uploadStatus = 'uploading';
    this.uploadedFileName = file.name;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenant_id', this.tenantId);
    formData.append('course_id', this.courseId);
    formData.append('course_title', this.courseTitle);
    formData.append('chapter_tag', this.chapterTag);

    this.http.post<any>(ENDPOINTS.REFERENCE.UPLOAD, formData).subscribe({
      next: (response) => {
        this.uploadId = response.upload_id;
        this.uploadStatus = 'processing';
        this.startPolling();
      },
      error: (err) => {
        this.uploadStatus = 'failed';
        this.uploadError = err.error?.detail || 'Upload failed. Please try again.';
      },
    });
  }

  // ── Status polling ────────────────────────────────────────────────────────

  private startPolling(): void {
    this.pollSubscription?.unsubscribe();

    this.pollSubscription = interval(3000)
      .pipe(
        switchMap(() =>
          this.http.get<any>(ENDPOINTS.REFERENCE.UPLOAD_STATUS(this.uploadId))
        ),
        takeWhile((res) => res.chunk_status === 'processing', true),
      )
      .subscribe({
        next: (res) => {
          if (res.chunk_status === 'done') {
            this.uploadStatus = 'done';
            this.chunkCount = res.chunk_count;
            this.pollSubscription?.unsubscribe();
          } else if (res.chunk_status === 'failed') {
            this.uploadStatus = 'failed';
            this.uploadError = res.error_message || 'Processing failed. Please re-upload.';
            this.pollSubscription?.unsubscribe();
          }
        },
        error: () => {
          this.uploadStatus = 'failed';
          this.uploadError = 'Could not check processing status. Please refresh and try again.';
        },
      });
  }

  // ── Lesson generation ─────────────────────────────────────────────────────

  generateCourseLessons(): void {
    if (this.uploadStatus !== 'done') return;

    this.generating = true;
    this.generationError = '';
    this.validationVerdict = '';
    this.validationScore = 0;

    this.http
      .post<any>(ENDPOINTS.REFERENCE.GENERATE_COURSE_LESSONS, {
        tenant_id: this.tenantId,
        course_id: this.courseId,
        course_title: this.courseTitle,
      })
      .subscribe({
        next: (response) => {
          this.generating = false;
          this.validationScore = response.final_score;
          this.validationVerdict = response.final_verdict;
          this.courseLessonsGenerated.emit(response.lessons as GeneratedLesson[]);
        },
        error: (err) => {
          this.generating = false;
          const detail = err.error?.detail;
          if (detail && typeof detail === 'object') {
            this.generationError = `Validation failed with score ${detail.final_score}/100. Please try again.`;
          } else {
            this.generationError = detail || 'Lesson generation failed. Please try again.';
          }
        },
      });
  }
}
