import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { AssignmentService } from '../../../../shared/services/assignment.service';
import { CourseService } from '../../../../shared/services/course.service';
import {
  StudentProfileService,
  StudentProfile,
} from '../../services/student-profile.service';

import { Assignment } from '../../../../shared/models/assignment.model';
import {
  AssignmentSubmission,
  AssignmentSubmissionCreatePayload,
} from '../../../../shared/models/assignment-submission.model';
import { AssignmentQueryParams } from '../../../../shared/models/assignment-query.model';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { AssignmentDetailComponent } from '../../components/assignment-detail/assignment-detail.component';

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

  assignments: (Assignment & {
    submitted?: boolean;
    effectiveStatus?: string;
  })[] = [];
  filteredAssignments: (Assignment & {
    submitted?: boolean;
    effectiveStatus?: string;
  })[] = [];
  submissions = new Map<string, AssignmentSubmission>();

  constructor(
    private studentProfileService: StudentProfileService,
    private assignmentService: AssignmentService,
    private courseService: CourseService,
  ) {}

  ngOnInit(): void {
    this.loadStudentProfile();
  }

  loadStudentProfile(): void {
    this.loading = true;

    this.studentProfileService.getMyProfile().subscribe({
      next: (profile) => {
        this.studentProfile = profile;
        this.tenantId = profile.tenantId || '';

        const courseRequests = profile.enrolledCourses.map((courseId) =>
          this.courseService.getCourseById(courseId, this.tenantId),
        );

        forkJoin(courseRequests).subscribe({
          next: (courses) => {
            this.enrolledCourses = courses.map((c) => ({
              id: c.id,
              name: c.title || c.courseName || 'Unknown',
            }));

            this.setupFilters();
            this.loadAssignments();
          },
          error: () => {
            this.showError('Failed to load courses.');
            this.loadAssignments();
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
      error: () => this.showError('Failed to load assignments.'),
    });
  }

  loadSubmissions(): void {
    this.assignmentService.getMySubmissions().subscribe({
      next: (subs) => {
        subs.forEach((s) => this.submissions.set(s.assignmentId, s));

        // Merge submission status into assignments
        this.assignments = this.assignments.map((a) => {
          const submission = this.submissions.get(a.id);
          let status = a.status;

          if (submission) {
            if (submission.obtainedMarks != null) {
              status = 'graded'; // if marks exist, status is graded
            } else {
              status = 'submitted'; // submission exists but not graded yet
            }
          }

          return {
            ...a,
            submitted: !!submission,
            effectiveStatus: status,
          };
        });

        this.filteredAssignments = [...this.assignments];
        this.loading = false;
      },
      error: () => {
        this.showError('Failed to load submissions.');
        this.loading = false;
      },
    });
  }

  hasSubmitted(assignmentId: string): boolean {
    return this.submissions.has(assignmentId);
  }

  setupFilters(): void {
    this.filterDropdowns = [
      {
        key: 'status',
        label: 'Status',
        options: ['active', 'submitted', 'graded'],
      },
      {
        key: 'courseName',
        label: 'Course',
        options: this.enrolledCourses.map((c) => c.name),
      },
    ];
  }

  onFiltersChange(filters: any): void {
    this.filteredAssignments = this.assignments.filter((a) => {
      let matches = true;

      if (filters.status) {
        matches = matches && a.effectiveStatus === filters.status;
      }

      if (filters.courseName) {
        matches = matches && a.courseName === filters.courseName;
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        matches =
          matches &&
          (a.title.toLowerCase().includes(search) ||
            a.courseName.toLowerCase().includes(search) ||
            (a.description?.toLowerCase().includes(search) ?? false));
      }

      return matches;
    });
  }

  handleAssignmentSubmit(payload: AssignmentSubmissionCreatePayload): void {
    // Prevent multiple submissions
    if (this.hasSubmitted(payload.assignmentId)) {
      this.showError('You have already submitted this assignment.');
      return;
    }

    const fullPayload = {
      ...payload,
      tenantId: this.tenantId,
      studentId: this.studentProfile.id,
    };

    this.assignmentService.submitAssignment(fullPayload).subscribe({
      next: (submission) => {
        this.submissions.set(submission.assignmentId, submission);

        // Update assignment to mark as submitted
        const idx = this.assignments.findIndex(
          (a) => a.id === submission.assignmentId,
        );
        if (idx > -1) {
          this.assignments[idx].submitted = true;
          this.assignments[idx].effectiveStatus = 'submitted';
          this.filteredAssignments = [...this.assignments];
        }

        this.showSuccess('Assignment submitted successfully.');
      },
      error: () => this.showError('Submission failed.'),
    });
  }

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
