import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Feature Components
import { CourseInfoCardComponent } from '../../components/course-info-card/course-info-card.component';
import { CourseBuilderTabsComponent } from '../../components/course-builder-tabs/course-builder-tabs.component';
import { CurriculumModuleComponent } from '../../components/curriculum-module/curriculum-module.component';
import { AddModuleModalComponent } from '../../components/add-module-modal/add-module-modal.component';
import { AddLessonModalComponent } from '../../components/add-lesson-modal/add-lesson-modal.component';
import { BulkUploadModalComponent } from '../../components/bulk-upload-modal/bulk-upload-modal.component';

// Services
import { CourseBuilderService } from '../../services/course-builder.service';
import { TeacherProfileService } from '../../services/teacher-profile.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

// Models
import {
  CourseBuilderData,
  Module,
  Lesson,
  EnrolledStudent,
  generateId,
  generateCourseCode,
  calculateTotalLessons,
  calculateTotalDuration,
} from '../../../../shared/models/course-builder.model';

type TabType = 'content' | 'settings' | 'students' | 'reviews';

@Component({
  selector: 'app-course-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CourseInfoCardComponent,
    CourseBuilderTabsComponent,
    CurriculumModuleComponent,
    AddModuleModalComponent,
    AddLessonModalComponent,
    BulkUploadModalComponent,
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

  // Category and Level options
  categoryOptions = [
    'General',
    'Computer Science',
    'Mathematics',
    'Science',
    'Business',
    'Arts',
    'Language',
    'Health',
    'Engineering',
    'Other'
  ];

  levelOptions = ['Beginner', 'Intermediate', 'Advanced'];
  isSaving = false;
  error: string | null = null;

  // Modal State
  showAddModuleModal = false;
  showAddLessonModal = false;
  showBulkUploadModal = false;
  editingModule: Module | null = null;
  editingLesson: Lesson | null = null;
  selectedModuleId: string | null = null;

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
    private toastService: ToastService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
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
        next: (profile: any) => {
          this.tenantId = profile.tenantId || '';
          this.teacherId = profile.id || '';
          
          // Get teacher name with multiple fallbacks (root level or nested in user object)
          const fullName = profile.fullName || profile.user?.fullName || profile.email?.split('@')[0] || 'Teacher';
          this.teacherName = fullName;
          this.teacherInitial = fullName.charAt(0).toUpperCase();
          
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
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load course:', err);
          this.error = 'Failed to load course. Please try again.';
          this.isLoading = false;
        },
      });
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

    if (this.editingModule) {
      // Edit existing module
      this.course.modules = this.course.modules.map((mod) =>
        mod.id === this.editingModule!.id ? { ...mod, ...moduleData } : mod
      );
      this.toastService.success('Module updated successfully');
    } else {
      // Add new module
      const newModule: Module = {
        id: generateId(),
        title: moduleData.title || 'New Module',
        description: moduleData.description || '',
        order: this.course.modules.length,
        lessons: [],
        isExpanded: true,
      };
      this.course.modules.push(newModule);
      this.toastService.success('Module added successfully');
    }

    this.closeAddModuleModal();
    this.saveCourse();
  }

  async onDeleteModule(moduleId: string): Promise<void> {
    if (!this.course) return;

    const module = this.course.modules.find((m) => m.id === moduleId);
    const confirmed = await this.confirmDialog.confirmDelete(module?.title);

    if (confirmed) {
      this.course.modules = this.course.modules
        .filter((m) => m.id !== moduleId)
        .map((m, index) => ({ ...m, order: index }));

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

    const moduleIndex = this.course.modules.findIndex(
      (m) => m.id === this.selectedModuleId
    );
    if (moduleIndex === -1) return;

    const module = this.course.modules[moduleIndex];

    if (this.editingLesson) {
      // Edit existing lesson
      module.lessons = module.lessons.map((lesson) =>
        lesson.id === this.editingLesson!.id
          ? { ...lesson, ...lessonData }
          : lesson
      );
      this.toastService.success('Lesson updated successfully');
    } else {
      // Add new lesson
      const newLesson: Lesson = {
        id: generateId(),
        title: lessonData.title || 'New Lesson',
        type: lessonData.type || 'video',
        duration: lessonData.duration || '',
        content: lessonData.content || '',
        order: module.lessons.length,
      };
      module.lessons.push(newLesson);
      this.toastService.success('Lesson added successfully');
    }

    this.course.totalLessons = calculateTotalLessons(this.course.modules);
    this.closeAddLessonModal();
    this.saveCourse();
  }

  async onDeleteLesson(moduleId: string, lessonId: string): Promise<void> {
    if (!this.course) return;

    const module = this.course.modules.find((m) => m.id === moduleId);
    if (!module) return;

    const lesson = module.lessons.find((l) => l.id === lessonId);
    const confirmed = await this.confirmDialog.confirmDelete(lesson?.title);

    if (confirmed) {
      module.lessons = module.lessons
        .filter((l) => l.id !== lessonId)
        .map((l, index) => ({ ...l, order: index }));

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

  // ========================
  // PUBLISH / SAVE
  // ========================

  async onPublish(): Promise<void> {
    if (!this.course) return;

    // Validation: must have at least 1 module with 1 lesson
    if (this.course.modules.length === 0) {
      this.toastService.error('Course must have at least one module to publish');
      return;
    }

    const hasLessons = this.course.modules.some((m) => m.lessons.length > 0);
    if (!hasLessons) {
      this.toastService.error('Course must have at least one lesson to publish');
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

    // Recalculate totals
    this.course.totalLessons = calculateTotalLessons(this.course.modules);
    this.course.totalDuration = calculateTotalDuration(this.course.modules);

    // Auto-generate course code if not set
    if (!this.course.courseCode) {
      this.course.courseCode = generateCourseCode(this.course.title);
    }

    const updateData = {
      title: this.course.title,
      description: this.course.description,
      category: this.course.category,
      level: this.course.level,
      thumbnailUrl: this.course.thumbnailUrl,
      courseCode: this.course.courseCode,
      modules: this.course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        order: m.order,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          duration: l.duration,
          content: l.content,
          order: l.order,
        })),
      })),
      isPublic: this.course.isPublic,
      isFree: this.course.isFree,
      price: this.course.price,
      currency: this.course.currency || 'USD',
    };

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

    // Append new modules to existing ones
    const startOrder = this.course.modules.length;
    const modulesToAdd = modules.map((m, index) => ({
      ...m,
      order: startOrder + index
    }));

    this.course.modules = [...this.course.modules, ...modulesToAdd];
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
    if (tab === 'students' && this.enrolledStudents.length === 0) {
      this.loadEnrolledStudents();
    }
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
    if (!this.studentSearchQuery.trim()) {
      return this.enrolledStudents;
    }
    const query = this.studentSearchQuery.toLowerCase();
    return this.enrolledStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
    );
  }

  async onUnenrollStudent(student: EnrolledStudent): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      'Unenroll Student',
      `Are you sure you want to unenroll ${student.fullName} from this course? They will lose access to all course content.`
    );

    if (confirmed) {
      this.courseBuilderService
        .unenrollStudent(this.courseId, this.tenantId, student.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.enrolledStudents = this.enrolledStudents.filter(
              (s) => s.id !== student.id
            );
            if (this.course) {
              this.course.enrolledStudents = Math.max(0, this.course.enrolledStudents - 1);
            }
            this.toastService.success(`${student.fullName} has been unenrolled`);
          },
          error: (err) => {
            console.error('Failed to unenroll student:', err);
            this.toastService.error('Failed to unenroll student');
          },
        });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
