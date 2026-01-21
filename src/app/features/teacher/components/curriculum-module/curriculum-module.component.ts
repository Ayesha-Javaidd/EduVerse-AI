import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Module, Lesson } from '../../../../shared/models/course-builder.model';
import { LessonItemComponent } from '../lesson-item/lesson-item.component';

@Component({
  selector: 'app-curriculum-module',
  standalone: true,
  imports: [CommonModule, LessonItemComponent],
  templateUrl: './curriculum-module.component.html',
  styleUrl: './curriculum-module.component.css',
})
export class CurriculumModuleComponent {
  @Input() module!: Module;
  @Input() moduleIndex: number = 0;

  @Output() toggleExpand = new EventEmitter<void>();
  @Output() editModule = new EventEmitter<void>();
  @Output() deleteModule = new EventEmitter<void>();
  @Output() addLesson = new EventEmitter<void>();
  @Output() editLesson = new EventEmitter<Lesson>();
  @Output() deleteLesson = new EventEmitter<string>();
  @Output() lessonReorder = new EventEmitter<Lesson[]>();

  // Drag state
  draggedLessonIndex: number | null = null;

  get moduleNumber(): string {
    return String(this.moduleIndex + 1).padStart(2, '0');
  }

  onToggleExpand(): void {
    this.toggleExpand.emit();
  }

  onEditModule(event: Event): void {
    event.stopPropagation();
    this.editModule.emit();
  }

  onDeleteModule(event: Event): void {
    event.stopPropagation();
    this.deleteModule.emit();
  }

  onAddLesson(): void {
    this.addLesson.emit();
  }

  onEditLesson(lesson: Lesson): void {
    this.editLesson.emit(lesson);
  }

  onDeleteLesson(lessonId: string): void {
    this.deleteLesson.emit(lessonId);
  }

  // Drag & Drop for lessons
  onDragStart(event: DragEvent, index: number): void {
    this.draggedLessonIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    
    if (this.draggedLessonIndex === null || this.draggedLessonIndex === targetIndex) {
      this.draggedLessonIndex = null;
      return;
    }

    const lessons = [...this.module.lessons];
    const [draggedLesson] = lessons.splice(this.draggedLessonIndex, 1);
    lessons.splice(targetIndex, 0, draggedLesson);

    // Update order property
    const reorderedLessons = lessons.map((lesson, idx) => ({
      ...lesson,
      order: idx,
    }));

    this.lessonReorder.emit(reorderedLessons);
    this.draggedLessonIndex = null;
  }

  onDragEnd(): void {
    this.draggedLessonIndex = null;
  }
}
