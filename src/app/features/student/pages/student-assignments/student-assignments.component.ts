import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssignmentService } from '../../../../shared/services/assignment.service';
import {
  StudentProfileService,
  StudentProfile,
} from '../../services/student-profile.service';

import {
  AssignmentSubmission,
  AssignmentSubmissionCreatePayload,
} from '../../../../shared/models/assignment-submission.model';

import { Assignment } from '../../../../shared/models/assignment.model';
import { AssignmentQueryParams } from '../../../../shared/models/assignment-query.model';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { EmptyStateComponent } from '../../../teacher/components/empty-state/empty-state.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { AssignmentDetailComponent } from '../../components/assignment-detail/assignment-detail.component';
import { CourseService } from '../../../../shared/services/course.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FiltersComponent,
    AssignmentDetailComponent,
  ],
  templateUrl: './student-assignments.component.html',
  styleUrls: ['./student-assignments.component.css'],
})
export class StudentAssignmentsComponent implements OnInit {
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  studentProfile!: StudentProfile;
  tenantId = '';
  filterDropdowns: { key: string; label: string; options: string[] }[] = [];

  enrolledCourses: { id: string; name: string }[] = [];
  assignments: Assignment[] = [];
  filteredAssignments: Assignment[] = [];
  submissions = new Map<string, AssignmentSubmission>();

  activeTab: 'active' | 'completed' = 'active';

  constructor(
    private studentProfileService: StudentProfileService,
    private assignmentService: AssignmentService,
    private courseService: CourseService,
  ) {}

  ngOnInit(): void {
    this.loadStudentProfile();
  }

  // loadStudentProfile(): void {
  //   this.loading = true;

  //   this.studentProfileService.getMyProfile().subscribe({
  //     next: (profile) => {
  //       this.studentProfile = profile;
  //       this.tenantId = profile.tenantId || '';
  //       this.loadAssignments();
  //     },
  //     error: () => {
  //       this.loading = false;
  //       this.showError('Failed to load student profile.');
  //     },
  //   });
  // }

  loadStudentProfile(): void {
    this.loading = true;

    this.studentProfileService.getMyProfile().subscribe({
      next: (profile) => {
        this.studentProfile = profile;
        this.tenantId = profile.tenantId || '';

        // Fetch full course info for enrolledCourses
        const courseRequests = profile.enrolledCourses.map((courseId) =>
          this.courseService.getCourseById(courseId, this.tenantId),
        );

        forkJoin(courseRequests).subscribe({
          next: (courses) => {
            this.enrolledCourses = courses.map((c) => ({
              id: c.id,
              name: c.title || c.courseName || 'Unknown',
            }));
            this.setupFilters(); // only if you implement this function
            this.loadAssignments();
          },
          error: (err) => {
            console.error('Failed to load courses', err);
            this.showError('Failed to load courses.');
            this.loadAssignments(); // still load assignments without filter
          },
        });
      },
      error: () => {
        this.loading = false;
        this.showError('Failed to load student profile.');
      },
    });
  }

  loadAssignments(): void {
    const params: AssignmentQueryParams = {
      tenantId: this.tenantId,
      sortBy: 'uploadedAt',
      order: -1,
      status: 'active',
    };

    this.assignmentService.getAssignments(params).subscribe({
      next: (res) => {
        this.assignments = res.results || [];
        this.filteredAssignments = [...this.assignments];
        this.loadSubmissions();
      },
      error: () => {
        this.showError('Failed to load assignments.');
      },
    });
  }

  loadSubmissions(): void {
    this.assignmentService.getMySubmissions().subscribe({
      next: (subs) => {
        subs.forEach((s) => this.submissions.set(s.assignmentId, s));
        this.applyFilter();
      },
      error: () => {
        this.showError('Failed to load submissions.');
      },
    });
  }

  hasSubmitted(assignmentId: string): boolean {
    return this.submissions.has(assignmentId);
  }

  applyFilter(): void {
    this.filteredAssignments = this.assignments.filter((a) =>
      this.activeTab === 'completed'
        ? this.hasSubmitted(a.id)
        : !this.hasSubmitted(a.id),
    );
  }

  setupFilters(): void {
    this.filterDropdowns = [
      {
        key: 'status',
        label: 'Status',
        options: ['active', 'submitted', 'graded'],
      },
      {
        key: 'courseId',
        label: 'Course',
        options: this.enrolledCourses.map((c) => c.name),
      },
    ];
  }

  onFiltersChange(filters: any): void {
    this.filteredAssignments = this.assignments.filter((a) => {
      let matches = true;

      if (filters.status) {
        matches = matches && a.status === filters.status;
      }

      if (filters.courseId) {
        matches = matches && a.courseId === filters.courseId;
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        matches =
          matches &&
          (a.title.toLowerCase().includes(search) ||
            (a.description?.toLowerCase().includes(search) ?? false));
      }

      return matches;
    });
  }

  /**  RECEIVES PAYLOAD FROM CHILD */
  handleAssignmentSubmit(payload: AssignmentSubmissionCreatePayload): void {
    // Add tenantId and studentId to payload
    const fullPayload = {
      ...payload,
      tenantId: this.tenantId,
      studentId: this.studentProfile.id,
    };

    console.log('Full payload sent to backend:', fullPayload);

    this.assignmentService.submitAssignment(fullPayload).subscribe({
      next: (submission) => {
        this.submissions.set(submission.assignmentId, submission);
        this.applyFilter();
        this.showSuccess('Assignment submitted successfully.');
      },
      error: (err) => {
        console.error('Submission failed:', err);
        this.showError('Submission failed.');
      },
    });
  }

  // handleAssignmentSubmit(payload: AssignmentSubmissionCreatePayload): void {
  //   console.log('Payload emitted to parent:', payload);
  //   this.assignmentService.submitAssignment(payload).subscribe({
  //     next: (submission) => {
  //       this.submissions.set(submission.assignmentId, submission);
  //       this.applyFilter();
  //       this.showSuccess('Assignment submitted successfully.');
  //     },
  //     error: () => {
  //       this.showError('Submission failed.');
  //     },
  //   });
  // }

  handleViewFeedback(assignment: Assignment): void {
    const submission = this.submissions.get(assignment.id);
    if (submission?.feedback) {
      alert(submission.feedback);
    }
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    setTimeout(() => (this.errorMessage = null), 4000);
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = null), 3000);
  }
}
