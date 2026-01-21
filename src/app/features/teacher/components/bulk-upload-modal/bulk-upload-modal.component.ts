import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Module, Lesson, generateId } from '../../../../shared/models/course-builder.model';

interface ParsedModule {
  title: string;
  description: string;
  lessons: ParsedLesson[];
}

interface ParsedLesson {
  title: string;
  type: 'video' | 'document' | 'quiz';
  duration?: string;
  content?: string;
}

@Component({
  selector: 'app-bulk-upload-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bulk-upload-modal.component.html',
  styleUrl: './bulk-upload-modal.component.css',
})
export class BulkUploadModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() upload = new EventEmitter<Module[]>();

  csvContent: string = '';
  parsedModules: ParsedModule[] = [];
  parseError: string | null = null;
  showPreview = false;

  // CSV Template example
  csvTemplate = `Module Title,Module Description,Lesson Title,Lesson Type,Lesson Duration,Lesson Content
Introduction to AI,Learn the basics of AI,What is Artificial Intelligence?,video,10:30,https://example.com/video1.mp4
Introduction to AI,Learn the basics of AI,History of AI,document,,This is a comprehensive guide...
Introduction to AI,Learn the basics of AI,AI Quiz,quiz,,quiz_id_123
Machine Learning Basics,Understanding ML fundamentals,Types of Machine Learning,video,15:45,https://example.com/video2.mp4
Machine Learning Basics,Understanding ML fundamentals,Supervised Learning Deep Dive,document,,Content about supervised learning...`;

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        this.csvContent = reader.result as string;
        this.parseCSV();
      };
      
      reader.onerror = () => {
        this.parseError = 'Failed to read file. Please try again.';
      };
      
      reader.readAsText(file);
    }
  }

  parseCSV(): void {
    this.parseError = null;
    this.parsedModules = [];

    try {
      const lines = this.csvContent.trim().split('\n');
      
      if (lines.length < 2) {
        this.parseError = 'CSV must have at least a header row and one data row.';
        return;
      }

      // Skip header row
      const dataLines = lines.slice(1);
      const moduleMap = new Map<string, ParsedModule>();

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        // Parse CSV line (simple parser - handles basic cases)
        const fields = this.parseCSVLine(line);
        
        if (fields.length < 4) {
          this.parseError = `Row ${i + 2}: Insufficient columns. Expected at least 4 columns.`;
          return;
        }

        const [moduleTitle, moduleDesc, lessonTitle, lessonType, duration, content] = fields;

        if (!moduleTitle || !lessonTitle) {
          this.parseError = `Row ${i + 2}: Module title and lesson title are required.`;
          return;
        }

        // Validate lesson type
        const validTypes = ['video', 'document', 'quiz'];
        const normalizedType = (lessonType?.toLowerCase() || 'video') as 'video' | 'document' | 'quiz';
        
        if (lessonType && !validTypes.includes(normalizedType)) {
          this.parseError = `Row ${i + 2}: Invalid lesson type "${lessonType}". Must be video, document, or quiz.`;
          return;
        }

        // Get or create module
        if (!moduleMap.has(moduleTitle)) {
          moduleMap.set(moduleTitle, {
            title: moduleTitle,
            description: moduleDesc || '',
            lessons: []
          });
        }

        const module = moduleMap.get(moduleTitle)!;
        module.lessons.push({
          title: lessonTitle,
          type: normalizedType,
          duration: duration || undefined,
          content: content || undefined
        });
      }

      this.parsedModules = Array.from(moduleMap.values());
      
      if (this.parsedModules.length === 0) {
        this.parseError = 'No valid data found in CSV.';
        return;
      }

      this.showPreview = true;
    } catch (error) {
      this.parseError = 'Failed to parse CSV. Please check the format.';
    }
  }

  // Simple CSV line parser that handles quoted fields
  private parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current.trim());
    return fields;
  }

  downloadTemplate(): void {
    const blob = new Blob([this.csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_bulk_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  onUpload(): void {
    if (this.parsedModules.length === 0) return;

    // Convert parsed modules to proper Module format
    const modules: Module[] = this.parsedModules.map((pm, moduleIndex) => ({
      id: generateId(),
      title: pm.title,
      description: pm.description,
      order: moduleIndex,
      lessons: pm.lessons.map((pl, lessonIndex) => ({
        id: generateId(),
        title: pl.title,
        type: pl.type,
        duration: pl.duration || '',
        content: pl.content || '',
        order: lessonIndex
      })),
      isExpanded: true
    }));

    this.upload.emit(modules);
  }

  get totalLessons(): number {
    return this.parsedModules.reduce((sum, m) => sum + m.lessons.length, 0);
  }
}
