// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// import { Assignment } from '../../../../shared/models/assignment.model';
// import { AssignmentSubmission } from '../../../../shared/models/assignment-submission.model';
// import { Course } from '../../../../shared/models/course.model';

// import { AssignmentService } from '../../../../shared/services/assignment.service';
// import { CourseService } from '../../../../shared/services/course.service';
// import {
//   TeacherProfileService,
//   TeacherProfile,
// } from '../../services/teacher-profile.service';

// import { AssignmentCardComponent } from '../../components/assignment-card/assignment-card.component';
// import { AssignmentModalComponent } from '../../components/assignment-modal/assignment-modal.component';
// import { ButtonComponent } from '../../../../shared/components/button/button.component';
// import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
// import { HeaderComponent } from '../../../../shared/components/header/header.component';
// import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';

// interface SubmittedAssignmentView {
//   assignment: Assignment;
//   submission: AssignmentSubmission;
// }

// @Component({
//   selector: 'app-generate-assignments',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     AssignmentCardComponent,
//     AssignmentModalComponent,
//     ButtonComponent,
//     StatCardComponent,
//     HeaderComponent,
//     EmptyStateComponent,
//   ],
//   templateUrl: './generate-assignments.component.html',
//   styleUrls: ['./generate-assignments.component.css'],
// })
// export class GenerateAssignmentsComponent implements OnInit {
//   loading = false;
//   errorMessage: string | null = null;
//   successMessage: string | null = null;

//   teacherProfile!: TeacherProfile;
//   teacherId = '';
//   tenantId = '';

//   courses: Course[] = [];
//   assignments: Assignment[] = [];
//   assignmentSubmissions = new Map<string, AssignmentSubmission[]>();

//   activeTab: 'active' | 'completed' = 'active';

//   showModal = false;
//   editingAssignmentId: string | null = null;
//   formData: any = {};

//   constructor(
//     private teacherProfileService: TeacherProfileService,
//     private assignmentService: AssignmentService,
//     private courseService: CourseService,
//   ) {}

//   ngOnInit(): void {
//     this.loadTeacherContext();
//   }

//   private loadTeacherContext(): void {
//     this.loading = true;
//     this.teacherProfileService.getMyProfile().subscribe({
//       next: (profile) => {
//         this.teacherProfile = profile;
//         this.teacherId = profile.id;
//         this.tenantId = profile.tenantId ?? '';
//         this.loadCourses();
//       },
//       error: () => {
//         this.loading = false;
//         this.showError('Failed to load teacher profile');
//       },
//     });
//   }

//   private loadCourses(): void {
//     this.courseService
//       .getCourses({ teacher_id: this.teacherId, tenantId: this.tenantId })
//       .subscribe({
//         next: (courses) => {
//           this.courses = courses;
//           this.loadAssignments();
//         },
//         error: () => {
//           this.loading = false;
//           this.showError('Failed to load courses');
//         },
//       });
//   }

//   private loadAssignments(): void {
//     this.loading = true;
//     this.assignmentService
//       .getAssignments({ sortBy: 'uploadedAt', order: -1 })
//       .subscribe({
//         next: (res) => {
//           const teacherCourseIds = this.courses.map((c) => c.id);
//           this.assignments = (res.results ?? []).filter((a) =>
//             teacherCourseIds.includes(a.courseId),
//           );

//           this.updateAssignmentStatuses();
//           this.loadAllSubmissions();
//           this.loading = false;
//         },
//         error: () => {
//           this.loading = false;
//           this.showError('Failed to load assignments');
//         },
//       });
//   }

//   private loadAllSubmissions(): void {
//     this.assignments.forEach((assignment) => {
//       this.assignmentService
//         .getSubmissionsByAssignment(assignment.id)
//         .subscribe({
//           next: (subs) => this.assignmentSubmissions.set(assignment.id, subs),
//           error: () => this.assignmentSubmissions.set(assignment.id, []),
//         });
//     });
//   }

//   /** Automatically mark past-due assignments as inactive */
//   private updateAssignmentStatuses(): void {
//     const now = new Date();
//     this.assignments.forEach((a) => {
//       if (new Date(a.dueDate) < now && a.status === 'active') {
//         a.status = 'inactive';
//       }
//     });
//   }

//   /** All assignments for display (active + inactive) */
//   get (): Assignment[] {
//     return this.assignments;
//   }

//   /** Submitted assignments view */
//   get submittedAssignments(): SubmittedAssignmentView[] {
//     const views: SubmittedAssignmentView[] = [];
//     this.assignments.forEach((assignment) => {
//       const submissions = this.assignmentSubmissions.get(assignment.id) ?? [];
//       submissions.forEach((submission) => {
//         views.push({ assignment, submission });
//       });
//     });
//     return views;
//   }

//   get filteredSubmissions(): SubmittedAssignmentView[] {
//     return this.activeTab === 'completed' ? this.submittedAssignments : [];
//   }

//   /** Modal and Editing */
//   openCreateModal(): void {
//     this.formData = {};
//     this.editingAssignmentId = null;
//     this.showModal = true;
//   }

//   openEditModal(assignment: Assignment): void {
//     if (assignment.status === 'inactive') {
//       this.showError('This assignment is inactive and cannot be updated', 4000);
//       return;
//     }

//     this.editingAssignmentId = assignment.id;
//     this.formData = {
//       title: assignment.title,
//       description: assignment.description,
//       courseId: assignment.courseId,
//       dueDate: assignment.dueDate.split('T')[0],
//       dueTime: assignment.dueDate.split('T')[1]?.slice(0, 5),
//       totalMarks: assignment.totalMarks,
//       passingMarks: assignment.passingMarks,
//     };
//     this.showModal = true;
//   }

//   closeModal(): void {
//     this.showModal = false;
//     this.formData = {};
//     this.editingAssignmentId = null;
//   }

//   handleSubmit(payload: any): void {
//     // --- VALIDATIONS ---
//     if (!payload.title || payload.title.trim().length < 3) {
//       this.showError('Assignment title must be at least 3 characters long');
//       return; // stops submission
//     }

//     if (payload.passingMarks > payload.totalMarks) {
//       this.showError('Passing marks cannot be greater than total marks');
//       return; // stops submission
//     }
//     const request$ = this.editingAssignmentId
//       ? this.assignmentService.updateAssignment(
//           this.editingAssignmentId,
//           payload,
//         )
//       : this.assignmentService.createAssignment(payload);

//     request$.subscribe(() => {
//       this.showSuccess('Assignment saved successfully');
//       this.loadAssignments();
//       this.closeModal();
//     });
//   }

//   deleteAssignment(assignment: Assignment): void {
//     this.assignmentService.deleteAssignment(assignment.id).subscribe({
//       next: () => {
//         this.assignments = this.assignments.filter(
//           (a) => a.id !== assignment.id,
//         );
//         this.showSuccess('Assignment deleted successfully');
//       },
//       error: () => this.showError('Failed to delete assignment'),
//     });
//   }

//   /** STATS */
//   get activeCount(): number {
//     return this.assignments.filter((a) => a.status === 'active').length;
//   }

//   get completedCount(): number {
//     return this.submittedAssignments.length;
//   }

//   get totalAssignmentsCount(): number {
//     return this.assignments.length;
//   }

//   get totalSubmissionsCount(): number {
//     return Array.from(this.assignmentSubmissions.values()).reduce(
//       (sum, subs) => sum + subs.length,
//       0,
//     );
//   }

//   /** FEEDBACK */
//   showSuccess(message: string, duration = 3000): void {
//     this.successMessage = message;
//     setTimeout(() => (this.successMessage = null), duration);
//   }

//   showError(message: string, duration = 3000, closeModalOnError = true): void {
//     this.errorMessage = message;
//     if (closeModalOnError && this.showModal) {
//       this.closeModal();
//     }
//     setTimeout(() => (this.errorMessage = null), duration);
//   }
// }

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
import { Router, RouterLink, RouterModule } from '@angular/router';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';

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
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
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
    { key: 'course', label: 'Course', options: [] }, // we'll populate course names dynamically
  ];

  filters: { [key: string]: string } = {
    search: '',
    status: '',
    course: '',
  };

  assignmentSubmissions = new Map<string, AssignmentSubmission[]>();

  activeTab: 'active' | 'completed' = 'active';

  showModal = false;
  editingAssignmentId: string | null = null;
  formData: any = {};

  constructor(
    private teacherProfileService: TeacherProfileService,
    private assignmentService: AssignmentService,
    private courseService: CourseService,
    private router: Router,
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

  private loadCourses(): void {
    this.courseService
      .getCourses({ teacher_id: this.teacherId, tenantId: this.tenantId })
      .subscribe({
        next: (courses) => {
          this.courses = courses;
          // Populate course dropdown options
          this.assignmentDropdowns.find((d) => d.key === 'course')!.options =
            courses.map((c) => c.courseName);
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

  /** All submissions for completed tab */
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

  /** Returns submissions for Completed tab */
  get filteredSubmissions(): SubmittedAssignmentView[] {
    return this.activeTab === 'completed' ? this.submittedAssignments : [];
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

    if (this.filters['course']) {
      const course = this.courses.find(
        (c) => c.courseName === this.filters['course'],
      );
      if (course)
        assignments = assignments.filter((a) => a.courseId === course.id);
    }

    if (this.filters['search']) {
      const searchLower = this.filters['search'].toLowerCase();
      assignments = assignments.filter((a) =>
        a.title.toLowerCase().includes(searchLower),
      );
    }

    return assignments;
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
  cardColors = [
    {
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      border: 'border border-blue-300',
      button: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
    {
      bg: 'bg-purple-50',
      text: 'text-purple-900',
      border: 'border border-purple-300',
      button: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    },
    {
      bg: 'bg-green-50',
      text: 'text-green-900',
      border: 'border border-green-300',
      button: 'bg-green-100 text-green-700 hover:bg-green-200',
    },
    {
      bg: 'bg-pink-50',
      text: 'text-pink-900',
      border: 'border border-pink-300',
      button: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
    },
    {
      bg: 'bg-yellow-50',
      text: 'text-yellow-900',
      border: 'border border-yellow-300',
      button: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    },
  ];

  getCardStyle(index: number, assignment: Assignment) {
    // Override background based on assignment status
    const isInactive = assignment.status === 'inactive';

    const color = this.cardColors[index % this.cardColors.length];

    const bgColor = isInactive ? 'bg-green-50' : color.bg; // green for inactive, original color for active

    return `${bgColor} ${color.text} ${color.border}`;
  }

  getButtonStyle(index: number) {
    return this.cardColors[index % this.cardColors.length].button;
  }
}
