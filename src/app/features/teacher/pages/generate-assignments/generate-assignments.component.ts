import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Assignment } from '../../../../shared/models/assignment.model';
import { AssignmentSubmission } from '../../../../shared/models/assignment-submission.model';
import { Course } from '../../../../shared/models/course.model';

import { AssignmentService } from '../../../../shared/services/assignment.service';
import { CourseService } from '../../../../shared/services/course.service';
import {
  TeacherProfileService,
  TeacherProfile,
} from '../../services/teacher-profile.service';

import { AssignmentCardComponent } from '../../components/assignment-card/assignment-card.component';
import { AssignmentModalComponent } from '../../components/assignment-modal/assignment-modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

interface SubmittedAssignmentView {
  assignment: Assignment;
  submission: AssignmentSubmission;
}

@Component({
  selector: 'app-generate-assignments',
  standalone: true,
  imports: [
    AssignmentCardComponent,
    AssignmentModalComponent,
    ButtonComponent,
    StatCardComponent,
    HeaderComponent,
    EmptyStateComponent,
    FiltersComponent,
    PaginationComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],

  templateUrl: './generate-assignments.component.html',
  styleUrls: ['./generate-assignments.component.css'],
})
export class GenerateAssignmentsComponent implements OnInit {
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  teacherProfile!: TeacherProfile;
  teacherId = '';
  tenantId = '';

  courses: Course[] = [];
  assignments: Assignment[] = [];

  assignmentDropdowns = [
    { key: 'status', label: 'Status', options: ['active', 'inactive'] },
  ];

  filters: { [key: string]: string } = {
    search: '',
    status: '',
    course: '',
  };

  assignmentSubmissions = new Map<string, AssignmentSubmission[]>();

  currentPage = 1;
  readonly pageSize = 6;

  showModal = false;
  editingAssignmentId: string | null = null;
  formData: any = {};

  constructor(
    private teacherProfileService: TeacherProfileService,
    private assignmentService: AssignmentService,
    private courseService: CourseService,
  ) {}

  ngOnInit(): void {
    this.loadTeacherContext();
  }

  private loadTeacherContext(): void {
    this.loading = true;
    this.teacherProfileService.getMyProfile().subscribe({
      next: (profile) => {
        this.teacherProfile = profile;
        this.teacherId = profile.id;
        this.tenantId = profile.tenantId ?? '';
        this.loadCourses();
      },
      error: () => {
        this.loading = false;
        this.showError('Failed to load teacher profile');
      },
    });
  }

  // private loadCourses(): void {
  //   this.courseService
  //     .getCourses({ teacher_id: this.teacherId, tenantId: this.tenantId })
  //     .subscribe({
  //       next: (courses) => {
  //         this.courses = courses;
  //         // Populate course dropdown options
  //         this.assignmentDropdowns.find((d) => d.key === 'course')!.options =
  //           courses.map((c) => c.courseName);
  //         this.loadAssignments();
  //       },
  //       error: () => {
  //         this.loading = false;
  //         this.showError('Failed to load courses');
  //       },
  //     });
  // }

  private loadCourses(): void {
    this.courseService
      .getCourses({ teacher_id: this.teacherId, tenantId: this.tenantId })
      .subscribe({
        next: (courses) => {
          this.courses = courses;

          // Only teacher's courses for the filter dropdown
          const courseDropdown = this.assignmentDropdowns.find(
            (d) => d.key === 'course',
          );
          if (courseDropdown) {
            courseDropdown.options = courses.map((c) => c.courseName);
          }

          this.loadAssignments();
        },
        error: () => {
          this.loading = false;
          this.showError('Failed to load courses');
        },
      });
  }

  private loadAssignments(): void {
    this.loading = true;
    this.assignmentService
      .getAssignments({ sortBy: 'uploadedAt', order: -1 })
      .subscribe({
        next: (res) => {
          const teacherCourseIds = this.courses.map((c) => c.id);
          this.assignments = (res.results ?? []).filter((a) =>
            teacherCourseIds.includes(a.courseId),
          );

          this.updateAssignmentStatuses();
          this.loadAllSubmissions();
          this.currentPage = 1;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.showError('Failed to load assignments');
        },
      });
  }

  private loadAllSubmissions(): void {
    this.assignments.forEach((assignment) => {
      this.assignmentService
        .getSubmissionsByAssignment(assignment.id)
        .subscribe({
          next: (subs) => this.assignmentSubmissions.set(assignment.id, subs),
          error: () => this.assignmentSubmissions.set(assignment.id, []),
        });
    });
  }

  /** Automatically mark past-due assignments as inactive */
  private updateAssignmentStatuses(): void {
    const now = new Date();
    this.assignments.forEach((a) => {
      if (new Date(a.dueDate) < now && a.status === 'active') {
        a.status = 'inactive';
      }
    });
  }

  // /** Active / Inactive assignments */
  // get filteredAssignments(): Assignment[] {
  //   return this.assignments.filter((a) =>
  //     this.activeTab === 'active'
  //       ? a.status === 'active'
  //       : a.status === 'inactive',
  //   );
  // }

  get submittedAssignments(): SubmittedAssignmentView[] {
    const views: SubmittedAssignmentView[] = [];
    this.assignments.forEach((assignment) => {
      const submissions = this.assignmentSubmissions.get(assignment.id) ?? [];
      submissions.forEach((submission) => {
        views.push({ assignment, submission });
      });
    });
    return views;
  }

  /** Modal and editing */
  openCreateModal(): void {
    this.formData = {};
    this.editingAssignmentId = null;
    this.showModal = true;
  }

  openEditModal(assignment: Assignment): void {
    if (assignment.status === 'inactive') {
      this.showError('This assignment is inactive and cannot be updated', 4000);
      return;
    }

    this.editingAssignmentId = assignment.id;
    this.formData = {
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.courseId,
      dueDate: assignment.dueDate.split('T')[0],
      dueTime: assignment.dueDate.split('T')[1]?.slice(0, 5),
      totalMarks: assignment.totalMarks,
      passingMarks: assignment.passingMarks,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = {};
    this.editingAssignmentId = null;
  }

  onFiltersChange(updatedFilters: { [key: string]: string }) {
    this.filters = updatedFilters;
    this.currentPage = 1;
  }

  // Filtered assignments using the filters
  get filteredAssignments(): Assignment[] {
    let assignments = [...this.assignments];

    // Status filter
    if (this.filters['status']) {
      assignments = assignments.filter(
        (a) => a.status === this.filters['status'],
      );
    }

    if (this.filters['search']) {
      const searchLower = this.filters['search'].toLowerCase();
      assignments = assignments.filter((a) =>
        a.title.toLowerCase().includes(searchLower),
      );
    }

    return assignments;
  }

  get paginatedAssignments(): Assignment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAssignments.slice(start, start + this.pageSize);
  }

  handleSubmit(payload: any): void {
    // Validation
    if (!payload.title || payload.title.trim().length < 3) {
      this.showError('Assignment title must be at least 3 characters long');
      return;
    }

    if (payload.passingMarks > payload.totalMarks) {
      this.showError('Passing marks cannot be greater than total marks');
      return;
    }

    const request$ = this.editingAssignmentId
      ? this.assignmentService.updateAssignment(
          this.editingAssignmentId,
          payload,
        )
      : this.assignmentService.createAssignment(payload);

    request$.subscribe((newAssignment: Assignment) => {
      this.showSuccess('Assignment saved successfully');

      if (this.editingAssignmentId) {
        // Update existing assignment in the array
        const index = this.assignments.findIndex(
          (a) => a.id === this.editingAssignmentId,
        );
        if (index !== -1) this.assignments[index] = newAssignment;
      } else {
        // New assignment, push it immediately
        this.assignments.unshift(newAssignment);
        this.assignmentSubmissions.set(newAssignment.id, []); // no submissions yet
        this.currentPage = 1;
      }

      this.closeModal();
    });
  }

  deleteAssignment(assignment: Assignment): void {
    this.assignmentService.deleteAssignment(assignment.id).subscribe({
      next: () => {
        this.assignments = this.assignments.filter(
          (a) => a.id !== assignment.id,
        );
        this.clampCurrentPage();
        this.showSuccess('Assignment deleted successfully');
      },
      error: () => this.showError('Failed to delete assignment'),
    });
  }

  /** Stats */
  get activeCount(): number {
    return this.assignments.filter((a) => a.status === 'active').length;
  }

  get completedCount(): number {
    return this.submittedAssignments.length;
  }

  get totalAssignmentsCount(): number {
    return this.assignments.length;
  }

  get totalSubmissionsCount(): number {
    return Array.from(this.assignmentSubmissions.values()).reduce(
      (sum, subs) => sum + subs.length,
      0,
    );
  }

  /** Feedback */
  showSuccess(message: string, duration = 3000): void {
    this.successMessage = message;
    setTimeout(() => (this.successMessage = null), duration);
  }

  showError(message: string, duration = 3000, closeModalOnError = true): void {
    this.errorMessage = message;
    if (closeModalOnError && this.showModal) {
      this.closeModal();
    }
    setTimeout(() => (this.errorMessage = null), duration);
  }

  private clampCurrentPage(): void {
    const totalPages = Math.max(
      1,
      Math.ceil(this.filteredAssignments.length / this.pageSize),
    );
    this.currentPage = Math.min(this.currentPage, totalPages);
  }
}
