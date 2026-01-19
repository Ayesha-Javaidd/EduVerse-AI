import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AssignmentSubmission } from '../../../../shared/models/assignment-submission.model';
import { Course } from '../../../../shared/models/course.model';
import { AssignmentService } from '../../../../shared/services/assignment.service';
import {
  TeacherProfileService,
  TeacherProfile,
} from '../../services/teacher-profile.service';
import { CourseService } from '../../../../shared/services/course.service';
import {
  Assignment,
  AssignmentCreatePayload,
  AssignmentUpdatePayload,
} from '../../../../shared/models/assignment.model';
import { AssignmentCardComponent } from '../../components/assignment-card/assignment-card.component';
import { AssignmentModalComponent } from '../../components/assignment-modal/assignment-modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';

@Component({
  selector: 'app-generate-assignments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AssignmentCardComponent,
    AssignmentModalComponent,
    ButtonComponent,
    StatCardComponent,
    HeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './generate-assignments.component.html',
  styleUrls: ['./generate-assignments.component.css'],
})
export class GenerateAssignmentsComponent implements OnInit {
  loading = false;
  error: string | null = null;

  teacherProfile!: TeacherProfile;
  teacherId = '';
  tenantId = '';

  courses: Course[] = [];
  assignments: Assignment[] = [];
  filteredAssignments: Assignment[] = [];

  assignmentSubmissionStatus = new Map<string, boolean>();

  activeTab: 'active' | 'inactive' | 'completed' = 'active';
  selectedAssignment: Assignment | null = null;
  showModal = false;
  formData: Partial<AssignmentCreatePayload> = {};
  editingAssignmentId: string | null = null;

  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private teacherProfileService: TeacherProfileService,
    private assignmentService: AssignmentService,
    private courseService: CourseService,
  ) {}

  ngOnInit(): void {
    // console.log('[Init] Loading teacher context...');
    this.loadTeacherContext();
  }

  /** Load teacher profile */
  loadTeacherContext(): void {
    this.loading = true;
    this.error = null;
    // console.log('[Profile] Fetching teacher profile...');
    this.teacherProfileService.getMyProfile().subscribe({
      next: (profile) => {
        console.log('[Profile] Loaded', profile);
        this.teacherProfile = profile;
        this.teacherId = profile.id;
        this.tenantId = profile.tenantId || '';

        this.loadCourses();
        this.loadAssignments();
      },
      error: (err) => {
        console.error('[Profile] Failed to load:', err);
        this.error = 'Failed to load teacher profile. Please try again.';
        this.loading = false;
      },
    });
  }

  /** Load courses for dropdown */
  loadCourses(): void {
    if (!this.teacherId || !this.tenantId) return;
    // console.log('[Courses] Fetching courses...');
    this.courseService
      .getCourses({ teacher_id: this.teacherId, tenantId: this.tenantId })
      .subscribe({
        next: (courses) => {
          console.log('[Courses] Loaded', courses);
          this.courses = courses;
        },
        error: (err) => console.error('[Courses] Failed to load:', err),
      });
  }

  /** Load assignments */
  loadAssignments(): void {
    this.loading = true;
    // console.log('[Assignments] Fetching assignments...');
    this.assignmentService
      .getAssignments({
        sortBy: 'uploadedAt',
        order: -1,
      })
      .subscribe({
        next: (res) => {
          console.log('[Assignments API Response]', res);
          console.log('[Assignments] Loaded', res.results);
          this.assignments = res.results || [];
          this.filteredAssignments = [...this.assignments];
          this.updateAssignmentStatus();
          this.loadSubmissionStatus(this.assignments);
          this.loading = false;
        },
        error: (err) => {
          console.error('[Assignments] Failed to load:', err);
          this.error = 'Failed to load assignments. Please try again.';
          this.loading = false;
        },
      });
  }

  /** Load submission status per assignment */
  loadSubmissionStatus(assignments: Assignment[]): void {
    console.log('[Submissions] Loading submission status...');
    assignments.forEach((assignment) => {
      this.assignmentService
        .getSubmissionsByAssignment(assignment.id)
        .subscribe({
          next: (subs: AssignmentSubmission[]) => {
            console.log(
              `[Submissions] Assignment ${assignment.id}:`,
              subs.length,
              'submissions',
            );
            this.assignmentSubmissionStatus.set(assignment.id, subs.length > 0);
          },
          error: () => {
            console.warn(
              `[Submissions] Assignment ${assignment.id} failed to load submissions`,
            );
            this.assignmentSubmissionStatus.set(assignment.id, false);
          },
        });
    });
  }

  hasSubmissions(assignmentId: string): boolean {
    return this.assignmentSubmissionStatus.get(assignmentId) ?? false;
  }

  /** Update assignment status if past due */
  updateAssignmentStatus(): void {
    const now = new Date().toISOString();
    console.log('[Status] Updating assignment status...');
    (this.assignments || []).forEach((assignment) => {
      if (assignment.dueDate < now && assignment.status === 'active') {
        console.log(`[Status] Assignment ${assignment.id} marked inactive`);
        assignment.status = 'inactive';
      }
    });
    this.applyFilter();
  }

  /** Filter assignments by activeTab */
  applyFilter(): void {
    console.log('[Filter] Filtering assignments by tab:', this.activeTab);
    this.filteredAssignments = (this.assignments || []).filter((a) =>
      this.activeTab === 'completed'
        ? a.status === 'inactive'
        : a.status === this.activeTab,
    );
    console.log('[Filter] Filtered assignments:', this.filteredAssignments);
  }

  /** Modal controls */
  openCreateModal(): void {
    console.log('[Modal] Opening create assignment modal');
    this.selectedAssignment = null;
    this.showModal = true;
    this.formData = {};
    this.editingAssignmentId = null;
  }

  openEditModal(assignment: Assignment): void {
    console.log('[Modal] Opening edit modal for assignment', assignment.id);
    this.selectedAssignment = assignment;
    this.showModal = true;
    this.editingAssignmentId = assignment.id;
    this.formData = {
      title: assignment.title,
      courseId: assignment.courseId,
      description: assignment.description,
      dueDate: assignment.dueDate.split('T')[0],
      dueTime: assignment.dueDate.split('T')[1]?.slice(0, 5) || undefined,
      totalMarks: assignment.totalMarks,
      passingMarks: assignment.passingMarks,
      allowedFormats: assignment.allowedFormats,
      fileUrl: assignment.fileUrl ?? undefined,
    };
    console.log('[Modal] Form data set', this.formData);
  }

  closeModal(): void {
    console.log('[Modal] Closing modal');
    this.selectedAssignment = null;
    this.showModal = false;
    this.formData = {};
    this.editingAssignmentId = null;
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = null;

    setTimeout(() => (this.successMessage = null), 3000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;

    setTimeout(() => (this.errorMessage = null), 4000);
  }

  /** Submit assignment create/edit */
  handleSubmit(payload: AssignmentCreatePayload): void {
    console.log('[Submit] Payload received:', payload);
    const normalizedPayload: Partial<Assignment> = {
      ...payload,
      dueTime: payload.dueTime ?? undefined,
      fileUrl: payload.fileUrl ?? undefined,
    };
    // console.log('[Submit] Normalized payload:', normalizedPayload);

    if (this.editingAssignmentId) {
      console.log('[Submit] Updating assignment:', this.editingAssignmentId);
      this.updateAssignment(this.editingAssignmentId, normalizedPayload);
    } else {
      console.log('[Submit] Creating new assignment');
      this.createAssignment(payload);
    }
  }

  /** Assignment actions */
  viewAssignment(assignment: Assignment): void {
    console.log('[Action] View assignment', assignment);
  }

  editAssignment(assignment: Assignment): void {
    console.log('[Action] Edit assignment', assignment.id);
    this.openEditModal(assignment);
  }

  deleteAssignment(assignment: Assignment): void {
    console.log('[Action] Delete assignment', assignment.id);
    this.assignmentService.deleteAssignment(assignment.id).subscribe(() => {
      console.log('[Delete] Assignment deleted:', assignment.id);
      this.assignments = (this.assignments || []).filter(
        (a) => a.id !== assignment.id,
      );
      this.applyFilter();
    });
  }

  toggleAssignmentStatus(assignment: Assignment): void {
    const newStatus = assignment.status === 'active' ? 'inactive' : 'active';
    console.log(`[Action] Toggle status for ${assignment.id} -> ${newStatus}`);
    this.updateAssignment(assignment.id, { status: newStatus });
  }

  updateAssignment(id: string, payload: Partial<Assignment>): void {
    console.log('[Update] Updating assignment', id, payload);

    this.assignmentService.updateAssignment(id, payload).subscribe({
      next: (updated) => {
        const idx = this.assignments.findIndex((a) => a.id === id);
        if (idx > -1) this.assignments[idx] = updated;

        this.applyFilter();
        this.closeModal();
        this.showSuccess('Assignment updated successfully');
      },
      error: (err) => {
        console.error('[Update] Failed to update assignment', err);
        this.showError('Failed to update assignment.');
      },
    });
  }

  createAssignment(payload: AssignmentCreatePayload): void {
    console.log('[Create] Creating assignment with payload', payload);

    this.assignmentService.createAssignment(payload).subscribe({
      next: (newAssignment) => {
        console.log('[Create] Assignment created', newAssignment);

        this.assignments.unshift(newAssignment);
        this.applyFilter();

        this.showModal = false;
        this.showSuccess('Assignment created successfully');
      },
      error: (err) => {
        console.error('[Create] Failed to create assignment', err);
        this.showError('Failed to create assignment. Please try again.');
      },
    });
  }

  /** Computed properties */
  get totalAssignmentsCount(): number {
    return (this.assignments || []).length;
  }

  get totalSubmissionsCount(): number {
    return (this.assignments || []).reduce(
      (count, a) =>
        count + ((this.assignmentSubmissionStatus.get(a.id) ?? false) ? 1 : 0),
      0,
    );
  }

  get activeCount(): number {
    return (this.assignments || []).filter((a) => a.status === 'active').length;
  }

  get completedCount(): number {
    return (this.assignments || []).filter((a) => a.status === 'inactive')
      .length;
  }
}
