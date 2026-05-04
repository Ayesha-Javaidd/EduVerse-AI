import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ENDPOINTS } from '../../../../core/constants/api.constants';

interface LessonDescription {
  lesson_title: string;
  overview: string;
  learning_objectives: string[];
  key_concepts: string[];
  difficulty_level: string;
  estimated_duration_minutes: number;
  prerequisite_topics: string[];
  error?: string;
}

interface LessonDescriptionResponse {
  status: 'success' | 'error';
  lesson_description?: LessonDescription;
  resolved_upload_id?: string;
  model_used?: string;
  message?: string;
}

export interface LessonDescriptionOutput {
  lessonId: string;
  title: string;
  overview: string;
  objectives: string[];
  keyConcepts: string[];
  difficultyLevel: string;
  estimatedDurationMinutes: number;
  prerequisiteTopics: string[];
}

@Component({
  selector: 'app-lesson-description',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="description-panel">
      <div class="header">
        <h3>AI Lesson Designer</h3>
        <button 
          id="generate-description-btn"
          [disabled]="loading || !topic"
          (click)="generateDescription()"
        >
          <span *ngIf="!loading">✨ Auto-Generate from Reference</span>
          <span *ngIf="loading">Generating...</span>
        </button>
      </div>

      <div class="input-group">
        <label>Topic / Title</label>
        <input type="text" [(ngModel)]="topic" placeholder="e.g. Introduction to Photosynthesis" />
        <p *ngIf="!lessonId" class="helper-text">
          Choose a target lesson above before applying this result.
        </p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loader-box">
        <div class="spinner"></div>
        <p>Analyzing reference material and designing curriculum...</p>
      </div>

      <!-- Result Card -->
      <div *ngIf="description && !loading" class="result-card">
        <div *ngIf="description.error" class="error-banner">
          ⚠️ {{ description.error }}
        </div>

        <div class="result-grid">
          <div class="field">
            <label>Suggested Title</label>
            <p>{{ description.lesson_title }}</p>
          </div>
          <div class="field">
            <label>Difficulty</label>
            <span class="badge">{{ description.difficulty_level }}</span>
          </div>
          <div class="field">
            <label>Duration</label>
            <p>{{ description.estimated_duration_minutes }} mins</p>
          </div>
        </div>

        <div class="section">
          <label>Overview</label>
          <p>{{ description.overview }}</p>
        </div>

        <div class="section">
          <label>Learning Objectives</label>
          <ul>
            <li *ngFor="let obj of description.learning_objectives">{{ obj }}</li>
          </ul>
        </div>

        <div class="section">
          <label>Key Concepts</label>
          <div class="tags">
            <span *ngFor="let tag of description.key_concepts" class="tag">{{ tag }}</span>
          </div>
        </div>

        <div class="actions">
          <button class="secondary" [disabled]="!description || !lessonId" (click)="applyToCourse()">Apply to Lesson</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .description-panel { padding: 1.5rem; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    h3 { margin: 0; color: #1e293b; }
    .input-group { margin-bottom: 1rem; }
    input { width: 100%; padding: .6rem; border: 1px solid #cbd5e1; border-radius: 6px; }
    button { background: #6366f1; color: white; border: none; padding: .6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 500; }
    button:disabled { opacity: 0.6; }
    .loader-box { text-align: center; padding: 2rem; color: #64748b; }
    .helper-text { margin: 0.5rem 0 0; font-size: 0.85rem; color: #64748b; }
    .result-card { margin-top: 1.5rem; padding: 1.5rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
    .result-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    label { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 0.25rem; }
    .badge { background: #e0e7ff; color: #4338ca; padding: .2rem .6rem; border-radius: 4px; font-size: 0.85rem; }
    .section { margin-top: 1rem; }
    ul { padding-left: 1.2rem; margin: 0.5rem 0; }
    .tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .tag { background: #f1f5f9; border: 1px solid #e2e8f0; padding: .2rem .5rem; border-radius: 4px; font-size: 0.8rem; }
    .error-banner { background: #fee2e2; color: #b91c1c; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; }
    .actions { margin-top: 1.5rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; text-align: right; }
    .secondary { background: #10b981; }
  `],
})
export class LessonDescriptionComponent {
  @Input() tenantId: string = '';
  @Input() courseId: string = '';
  @Input() lessonId: string = '';
  @Input() topic: string = '';
  @Output() descriptionApplied = new EventEmitter<LessonDescriptionOutput>();

  loading = false;
  description: LessonDescription | null = null;

  constructor(private http: HttpClient) {}

  generateDescription(): void {
    if (!this.topic) return;

    this.loading = true;
    this.http.post<LessonDescriptionResponse>(ENDPOINTS.REFERENCE.GENERATE_DESCRIPTION, {
      topic: this.topic,
      tenant_id: this.tenantId,
      course_id: this.courseId,
      lesson_id: this.lessonId
    }).subscribe({
      next: (res) => {
        if (res.status === 'success' && res.lesson_description) {
          this.description = res.lesson_description;
        } else {
          this.description = {
            lesson_title: this.topic,
            overview: '',
            learning_objectives: [],
            key_concepts: [],
            difficulty_level: 'intermediate',
            estimated_duration_minutes: 30,
            prerequisite_topics: [],
            error: res.message || 'Please upload a reference file first.'
          };
        }
        this.loading = false;
      },
      error: (err) => {
        this.description = {
          lesson_title: this.topic,
          overview: '',
          learning_objectives: [],
          key_concepts: [],
          difficulty_level: 'intermediate',
          estimated_duration_minutes: 30,
          prerequisite_topics: [],
          error: err.error?.detail || 'Failed to generate description'
        };
        this.loading = false;
      }
    });
  }

  applyToCourse(): void {
    if (!this.description || !this.lessonId) {
      return;
    }

    this.descriptionApplied.emit({
      lessonId: this.lessonId,
      title: this.description.lesson_title,
      overview: this.description.overview,
      objectives: this.description.learning_objectives ?? [],
      keyConcepts: this.description.key_concepts ?? [],
      difficultyLevel: this.description.difficulty_level,
      estimatedDurationMinutes: this.description.estimated_duration_minutes,
      prerequisiteTopics: this.description.prerequisite_topics ?? [],
    });
  }
}
