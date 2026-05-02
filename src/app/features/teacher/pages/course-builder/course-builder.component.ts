import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Feature Components
import { CourseBuilderTabsComponent } from '../../components/course-builder-tabs/course-builder-tabs.component';
import { CurriculumModuleComponent } from '../../components/curriculum-module/curriculum-module.component';
import { AddModuleModalComponent } from '../../components/add-module-modal/add-module-modal.component';
import { AddLessonModalComponent } from '../../components/add-lesson-modal/add-lesson-modal.component';
import { BulkUploadModalComponent } from '../../components/bulk-upload-modal/bulk-upload-modal.component';
import {
  ReferenceUploadComponent,
  GeneratedLesson,
} from '../../components/reference-upload/reference-upload.component';
import {
  LessonDescriptionComponent,
  LessonDescriptionOutput,
} from '../../components/lesson-description/lesson-description.component';

// Services
import { CourseBuilderService } from '../../services/course-builder.service';
import { CourseMetadataService } from '../../../../shared/services/course-metadata.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { TeacherProfileService } from '../../../../shared/services/teacher-profile.service';

// Models
import {
  CourseBuilderData,
  Module,
  Lesson,
  EnrolledStudent,
  calculateTotalLessons,
  calculateTotalDuration,
} from '../../../../shared/models/course-builder.model';
import { CourseMetadata } from '../../../../shared/models/course-metadata.model';
import { TeacherResponse } from '../../../../shared/models/teacher-profile.models';
import {
  appendBulkModules,
  buildCourseUpdatePayload,
  deriveTeacherIdentity,
  filterEnrolledStudents,
  formatCourseBuilderDate,
  getPublishValidationError,
  normalizeCourseTotals,
  removeLesson,
  removeModule,
  syncCourseMetadataOptions,
  upsertLesson,
  upsertModule,
} from './course-builder.helpers';

type TabType = 'content' | 'settings' | 'students' | 'references';

@Component({
  selector: 'app-course-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CourseBuilderTabsComponent,
    CurriculumModuleComponent,
    AddModuleModalComponent,
    AddLessonModalComponent,
    BulkUploadModalComponent,
    ReferenceUploadComponent,
    LessonDescriptionComponent,
  ],
  templateUrl: './course-builder.component.html',
  styleUrl: './course-builder.component.css',
})
export class CourseBuilderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Course data
  course: CourseBuilderData | null = null;
  courseId: string = '';
  tenantId: string = '';
  teacherId: string = '';

  // Teacher profile for header
  teacherName: string = '';
  teacherInitial: string = 'T';

  // UI State
  activeTab: TabType = 'content';
  isLoading = true;
  isLoadingMetadata = true;
  metadataError: string | null = null;

  // Category and Level options
  categoryOptions: string[] = [];
  levelOptions: string[] = [];
  private courseMetadata: CourseMetadata | null = null;
  isSaving = false;
  error: string | null = null;

  // Modal State
  showAddModuleModal = false;
  showAddLessonModal = false;
  showBulkUploadModal = false;
  editingModule: Module | null = null;
  editingLesson: Lesson | null = null;
  selectedModuleId: string | null = null;
  selectedLessonIdForAI = '';
  selectedLessonTopicForAI = '';

  // Student Management
  enrolledStudents: EnrolledStudent[] = [];
  isLoadingStudents = false;
  studentSearchQuery = '';

  // Module Drag & Drop State
  draggedModuleIndex: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseBuilderService: CourseBuilderService,
    private teacherProfileService: TeacherProfileService,
    private courseMetadataService: CourseMetadataService,
    private toastService: ToastService,
    private confirmDialog: ConfirmDialogService
  ) { }

  ngOnInit(): void {
    this.loadCourseMetadata();
    this.loadTeacherContext();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load teacher profile to get tenantId, then load course
   */
  loadTeacherContext(): void {
    this.teacherProfileService
      .getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile: TeacherResponse & { user?: { fullName?: string } }) => {
          const teacherIdentity = deriveTeacherIdentity(profile);
          this.tenantId = teacherIdentity.tenantId;
          this.teacherId = teacherIdentity.teacherId;
          this.teacherName = teacherIdentity.teacherName;
          this.teacherInitial = teacherIdentity.teacherInitial;

          this.courseId = this.route.snapshot.paramMap.get('id') || '';

          if (this.courseId && this.tenantId) {
            this.loadCourse();
          } else {
            this.error = 'Missing course ID or tenant information';
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Failed to load teacher profile:', err);
          this.error = 'Failed to load teacher profile';
          this.isLoading = false;
        },
      });
  }

  loadCourseMetadata(forceRefresh = false): void {
    this.isLoadingMetadata = true;
    this.metadataError = null;

    this.courseMetadataService
      .getMetadata(forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metadata) => {
          this.courseMetadata = metadata;
          this.syncMetadataOptions();
          this.isLoadingMetadata = false;
        },
        error: (err) => {
          console.error('Failed to load course metadata:', err);
          this.metadataError = 'Unable to load category and level options.';
          this.isLoadingMetadata = false;
        },
      });
  }

  /**
   * Load course data for the builder
   */
  private loadCourse(): void {
    this.isLoading = true;
    this.error = null;

    this.courseBuilderService
      .getCourseForBuilder(this.courseId, this.tenantId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => {
          this.course = course;
          this.syncMetadataOptions();
          this.ensureLessonSelectedForAI();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load course:', err);
          this.error = 'Failed to load course. Please try again.';
          this.isLoading = false;
        },
      });
  }

  private syncMetadataOptions(): void {
    if (!this.courseMetadata) {
      return;
    }

    const metadataState = syncCourseMetadataOptions(this.courseMetadata, this.course);
    this.course = metadataState.course;
    this.categoryOptions = metadataState.categoryOptions;
    this.levelOptions = metadataState.levelOptions;
  }

  /**
   * Toggle module expand/collapse
   */
  onToggleModule(moduleId: string): void {
    if (!this.course) return;

    this.course.modules = this.course.modules.map((mod) => ({
      ...mod,
      isExpanded: mod.id === moduleId ? !mod.isExpanded : mod.isExpanded,
    }));
  }

  /**
   * Collapse all modules
   */
  onCollapseAll(): void {
    if (!this.course) return;

    this.course.modules = this.course.modules.map((mod) => ({
      ...mod,
      isExpanded: false,
    }));
  }

  // ========================
  // MODULE OPERATIONS
  // ========================

  openAddModuleModal(module?: Module): void {
    this.editingModule = module || null;
    this.showAddModuleModal = true;
  }

  closeAddModuleModal(): void {
    this.showAddModuleModal = false;
    this.editingModule = null;
  }

  onSaveModule(moduleData: Partial<Module>): void {
    if (!this.course) return;

    this.course.modules = upsertModule(
      this.course.modules,
      moduleData,
      this.editingModule
    );
    this.toastService.success(
      this.editingModule ? 'Module updated successfully' : 'Module added successfully'
    );

    this.closeAddModuleModal();
    this.saveCourse();
  }

  async onDeleteModule(moduleId: string): Promise<void> {
    if (!this.course) return;

    const module = this.course.modules.find((m) => m.id === moduleId);
    const confirmed = await this.confirmDialog.confirmDelete(module?.title);

    if (confirmed) {
      this.course.modules = removeModule(this.course.modules, moduleId);

      this.course.totalLessons = calculateTotalLessons(this.course.modules);
      this.toastService.success('Module deleted successfully');
      this.saveCourse();
    }
  }

  // ========================
  // LESSON OPERATIONS
  // ========================

  openAddLessonModal(moduleId: string, lesson?: Lesson): void {
    this.selectedModuleId = moduleId;
    this.editingLesson = lesson || null;
    this.showAddLessonModal = true;
  }

  closeAddLessonModal(): void {
    this.showAddLessonModal = false;
    this.editingLesson = null;
    this.selectedModuleId = null;
  }

  onSaveLesson(lessonData: Partial<Lesson>): void {
    if (!this.course || !this.selectedModuleId) return;

    this.course.modules = upsertLesson(
      this.course.modules,
      this.selectedModuleId,
      lessonData,
      this.editingLesson
    );
    this.ensureLessonSelectedForAI();
    this.toastService.success(
      this.editingLesson ? 'Lesson updated successfully' : 'Lesson added successfully'
    );

    this.course.totalLessons = calculateTotalLessons(this.course.modules);
    this.closeAddLessonModal();
    this.saveCourse();
  }

  onLessonSelectedForAI(lesson: Lesson): void {
    this.setSelectedLessonForAI(lesson);
    this.activeTab = 'references';
    this.toastService.info(`AI designer ready for "${lesson.title}".`);
  }

  onAiLessonSelectionChange(lessonId: string): void {
    const target = this.findLessonForAi(lessonId);
    if (!target) {
      this.selectedLessonIdForAI = '';
      this.selectedLessonTopicForAI = '';
      return;
    }

    this.setSelectedLessonForAI(target.lesson);
  }

  onDescriptionApplied(data: LessonDescriptionOutput): void {
    if (!this.course) {
      return;
    }

    const target = this.findLessonForAi(data.lessonId);
    if (!target) {
      this.toastService.error('Selected lesson could not be found.');
      return;
    }

    const draftLesson: Lesson = {
      ...target.lesson,
      title: data.title || target.lesson.title,
      content: this.buildLessonContentFromAiDescription(data),
      duration:
        data.estimatedDurationMinutes > 0
          ? `${data.estimatedDurationMinutes} mins`
          : target.lesson.duration,
    };

    this.setSelectedLessonForAI(draftLesson);
    this.activeTab = 'content';
    this.openAddLessonModal(target.module.id, draftLesson);
    this.toastService.info('AI lesson draft loaded into the editor. Review and click Update Lesson to save.');
  }

  async onDeleteLesson(moduleId: string, lessonId: string): Promise<void> {
    if (!this.course) return;

    const module = this.course.modules.find((m) => m.id === moduleId);
    if (!module) return;

    const lesson = module.lessons.find((l) => l.id === lessonId);
    const confirmed = await this.confirmDialog.confirmDelete(lesson?.title);

    if (confirmed) {
      const wasSelectedForAI = this.selectedLessonIdForAI === lessonId;
      this.course.modules = removeLesson(this.course.modules, moduleId, lessonId);
      if (wasSelectedForAI) {
        this.selectedLessonIdForAI = '';
        this.selectedLessonTopicForAI = '';
      }
      this.ensureLessonSelectedForAI();

      this.course.totalLessons = calculateTotalLessons(this.course.modules);
      this.toastService.success('Lesson deleted successfully');
      this.saveCourse();
    }
  }

  // ========================
  // DRAG & DROP
  // ========================

  onModuleReorder(modules: Module[]): void {
    if (!this.course) return;

    // Update local state immediately (optimistic update)
    this.course.modules = modules.map((m, index) => ({ ...m, order: index }));

    // Persist to backend
    const moduleIds = modules.map((m) => m.id);

    this.courseBuilderService
      .reorderModules(this.courseId, this.tenantId, moduleIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          console.error('Failed to reorder modules:', err);
          this.toastService.error('Failed to save order. Please try again.');
          this.loadCourse(); // Rollback by reloading
        },
      });
  }

  // Module Drag & Drop Handlers
  onModuleDragStart(event: DragEvent, index: number): void {
    this.draggedModuleIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onModuleDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onModuleDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();

    if (!this.course || this.draggedModuleIndex === null || this.draggedModuleIndex === targetIndex) {
      this.draggedModuleIndex = null;
      return;
    }

    const modules = [...this.course.modules];
    const [draggedModule] = modules.splice(this.draggedModuleIndex, 1);
    modules.splice(targetIndex, 0, draggedModule);

    // Update order property and emit reorder
    const reorderedModules = modules.map((mod, idx) => ({
      ...mod,
      order: idx,
    }));

    this.onModuleReorder(reorderedModules);
    this.draggedModuleIndex = null;
  }

  onModuleDragEnd(): void {
    this.draggedModuleIndex = null;
  }

  onLessonReorder(moduleId: string, lessons: Lesson[]): void {
    if (!this.course) return;

    // Update local state immediately (optimistic update)
    const moduleIndex = this.course.modules.findIndex((m) => m.id === moduleId);
    if (moduleIndex === -1) return;

    this.course.modules[moduleIndex].lessons = lessons.map((l, index) => ({
      ...l,
      order: index,
    }));

    // Recalculate total duration
    this.course.totalDuration = calculateTotalDuration(this.course.modules);

    // Persist to backend
    const lessonIds = lessons.map((l) => l.id);

    this.courseBuilderService
      .reorderLessons(this.courseId, this.tenantId, moduleId, lessonIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          console.error('Failed to reorder lessons:', err);
          this.toastService.error('Failed to save order. Please try again.');
          this.loadCourse(); // Rollback by reloading
        },
      });
  }

  // ========================
  // PRICING
  // ========================

  onToggleFree(isFree: boolean): void {
    if (!this.course) return;
    this.course.isFree = isFree;
    if (isFree) {
      this.course.price = 0;
    }
    this.saveCourse();
  }

  onPriceChange(): void {
    this.saveCourse();
  }

  // ========================
  // VISIBILITY
  // ========================

  async onToggleVisibility(): Promise<void> {
    if (!this.course) return;

    const newVisibility = !this.course.isPublic;
    const actionText = newVisibility ? 'Public' : 'Private';
    const message = newVisibility
      ? `Making this course public will show it in the course marketplace (when published). Continue?`
      : `Making this course private will hide it from the marketplace. Only enrolled students can access it. Continue?`;

    const confirmed = await this.confirmDialog.confirm(
      `Make Course ${actionText}`,
      message
    );

    if (confirmed) {
      this.course.isPublic = newVisibility;
      this.saveCourse();
      this.toastService.success(`Course is now ${actionText.toLowerCase()}`);
    }
  }

  // ========================
  // COURSE INFO EDIT
  // ========================

  onEditCourseInfo(): void {
    // Navigate to settings tab for editing course info
    this.activeTab = 'settings';
  }

  onSaveCourseInfo(data: Partial<CourseBuilderData>): void {
    if (!this.course) return;
    this.course = { ...this.course, ...data };
    this.saveCourse();
  }

  private buildLessonContentFromAiDescription(data: LessonDescriptionOutput): string {
    const sections: string[] = [];

    if (data.overview) {
      sections.push(`## Overview\n${data.overview}`);
    }

    if (data.objectives.length) {
      sections.push(
        `## Learning Objectives\n${data.objectives.map((objective) => `- ${objective}`).join('\n')}`,
      );
    }

    if (data.keyConcepts.length) {
      sections.push(
        `## Key Concepts\n${data.keyConcepts.map((concept) => `- ${concept}`).join('\n')}`,
      );
    }

    if (data.prerequisiteTopics.length) {
      sections.push(
        `## Prerequisite Topics\n${data.prerequisiteTopics.map((topic) => `- ${topic}`).join('\n')}`,
      );
    }

    if (data.difficultyLevel) {
      sections.push(`## Difficulty\n${data.difficultyLevel}`);
    }

    return sections.join('\n\n').trim();
  }

  private setSelectedLessonForAI(lesson: Lesson): void {
    this.selectedLessonIdForAI = lesson._id || lesson.id;
    this.selectedLessonTopicForAI = lesson.title || '';
  }

  private findLessonForAi(lessonId: string): { module: Module; lesson: Lesson } | null {
    if (!this.course || !lessonId) {
      return null;
    }

    for (const module of this.course.modules) {
      const lesson = module.lessons.find((item) => (item._id || item.id) === lessonId);
      if (lesson) {
        return { module, lesson };
      }
    }

    return null;
  }

  private ensureLessonSelectedForAI(): void {
    if (!this.course) {
      return;
    }

    if (this.selectedLessonIdForAI) {
      const existingSelection = this.findLessonForAi(this.selectedLessonIdForAI);
      if (existingSelection) {
        this.setSelectedLessonForAI(existingSelection.lesson);
        return;
      }
    }

    for (const module of this.course.modules) {
      if (module.lessons.length > 0) {
        this.setSelectedLessonForAI(module.lessons[0]);
        return;
      }
    }

    this.selectedLessonIdForAI = '';
    this.selectedLessonTopicForAI = '';
  }

  // ========================
  // AI COURSE GENERATION
  // ========================

  /**
   * Called when reference-upload component emits lessons generated by AI.
   * Auto-fills the course modules section and saves to MongoDB.
   */
  onCourseLessonsGenerated(lessons: GeneratedLesson[]): void {
    if (!this.course || !lessons?.length) return;

    this.course.modules = lessons.map((lesson, index) => ({
      id:         `ai_module_${index + 1}`,
      title:      lesson.title,
      order:      index + 1,
      isExpanded: true,
      lessons: [
        {
          id:                `ai_lesson_${index + 1}`,
          title:             lesson.title,
          type:              'reading',
          description:       lesson.summary,
          content:           lesson.summary,
          objectives:        lesson.objectives,
          keyConcepts:       lesson.key_concepts,
          duration:          `${lesson.estimated_duration_minutes || 30}:00`,
          estimatedDuration: lesson.estimated_duration_minutes || 30,
          order:             1,
          isAiGenerated:     true,
        } as any,
      ],
    }));

    this.course.totalLessons = lessons.length;
    this.toastService.success(
      `AI generated ${lessons.length} lesson${lessons.length !== 1 ? 's' : ''} — review and save!`
    );

    // Auto-save generated lessons to MongoDB
    this.saveCourse();

    // Switch to content tab and scroll to modules section
    this.activeTab = 'content';
    setTimeout(() => {
      document.getElementById('course-modules-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }

  // ========================
  // PUBLISH / SAVE
  // ========================

  async onPublish(): Promise<void> {
    if (!this.course) return;

    const publishValidationError = getPublishValidationError(this.course);
    if (publishValidationError) {
      this.toastService.error(publishValidationError);
      return;
    }

    const shouldPublish = this.course.status !== 'published';

    // Confirm action with dialog
    const actionName = shouldPublish ? 'Publish' : 'Unpublish';
    const message = shouldPublish
      ? `Publishing "${this.course.title}" will make it available to students. Do you want to continue?`
      : `Unpublishing "${this.course.title}" will hide it from new students. Enrolled students will still have access. Do you want to continue?`;

    const confirmed = await this.confirmDialog.confirm(
      `${actionName} Course`,
      message
    );

    if (!confirmed) return;

    this.isSaving = true;
    this.courseBuilderService
      .publishCourse(this.courseId, this.tenantId, shouldPublish)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedCourse) => {
          this.course!.status = updatedCourse.status;
          this.isSaving = false;
          this.toastService.success(
            shouldPublish
              ? 'Course published successfully!'
              : 'Course unpublished'
          );
        },
        error: (err) => {
          console.error('Failed to publish course:', err);
          this.isSaving = false;
          this.toastService.error('Failed to update publish status');
        },
      });
  }

  /**
   * Save course to backend (draft save)
   */
  saveCourse(): void {
    if (!this.course) return;

    this.isSaving = true;
    this.course = normalizeCourseTotals(this.course);
    const updateData = buildCourseUpdatePayload(this.course);

    this.courseBuilderService
      .updateCourse(this.courseId, this.tenantId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
        },
        error: (err) => {
          console.error('Failed to save course:', err);
          this.isSaving = false;
          this.toastService.error('Failed to save changes');
        },
      });
  }

  /**
   * Navigate back to courses list
   */
  goBack(): void {
    this.router.navigate(['/teacher/courses']);
  }

  // ========================
  // BULK UPLOAD
  // ========================

  openBulkUploadModal(): void {
    this.showBulkUploadModal = true;
  }

  closeBulkUploadModal(): void {
    this.showBulkUploadModal = false;
  }

  onBulkUpload(modules: Module[]): void {
    if (!this.course) return;

    this.course.modules = appendBulkModules(this.course.modules, modules);
    this.course.totalLessons = calculateTotalLessons(this.course.modules);
    this.course.totalDuration = calculateTotalDuration(this.course.modules);

    this.closeBulkUploadModal();
    this.saveCourse();
    this.toastService.success(`Successfully imported ${modules.length} module(s)`);
  }

  // ========================
  // STUDENT MANAGEMENT
  // ========================

  /**
   * Handle tab change - load students when switching to students tab
   */
  onTabChange(tab: TabType): void {
    this.activeTab = tab;
    if (tab === 'references') {
      this.ensureLessonSelectedForAI();
    }
    if (tab === 'students' && this.enrolledStudents.length === 0) {
      this.loadEnrolledStudents();
    }
  }

  get aiLessonOptions(): Array<{ id: string; title: string; moduleTitle: string }> {
    if (!this.course) {
      return [];
    }

    return this.course.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        id: lesson._id || lesson.id,
        title: lesson.title,
        moduleTitle: module.title,
      })),
    );
  }

  loadEnrolledStudents(): void {
    if (!this.course) return;

    this.isLoadingStudents = true;
    this.courseBuilderService
      .getEnrolledStudents(this.courseId, this.tenantId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (students) => {
          this.enrolledStudents = students;
          this.isLoadingStudents = false;
        },
        error: (err) => {
          console.error('Failed to load enrolled students:', err);
          this.isLoadingStudents = false;
          // Don't show error toast - may just be no students yet
        },
      });
  }

  get filteredStudents(): EnrolledStudent[] {
    return filterEnrolledStudents(this.enrolledStudents, this.studentSearchQuery);
  }

  formatDate(dateString: string): string {
    return formatCourseBuilderDate(dateString);
  }
}
