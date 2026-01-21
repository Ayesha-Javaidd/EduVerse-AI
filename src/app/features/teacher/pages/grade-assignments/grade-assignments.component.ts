import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssignmentService } from '../../../../shared/services/assignment.service';
import { TeacherProfileService } from '../../services/teacher-profile.service';

import { Assignment } from '../../../../shared/models/assignment.model';
import { AssignmentSubmission } from '../../../../shared/models/assignment-submission.model';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { GradeAssignmentModalComponent } from '../../components/grade-assignment-modal/grade-assignment-modal.component';

@Component({
  selector: 'app-grade-assignments',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    GradeAssignmentModalComponent,
  ],
  templateUrl: './grade-assignments.component.html',
  styleUrls: ['./grade-assignments.component.css'],
})
export class GradeAssignmentsComponent implements OnInit {
  loading = false;

  assignments: Assignment[] = [];
  submissions: AssignmentSubmission[] = [];

  selectedSubmission: AssignmentSubmission | null = null;

  constructor(
    private assignmentService: AssignmentService,
    private teacherProfileService: TeacherProfileService,
  ) {}

  ngOnInit(): void {
    this.loadTeacherAssignments();
  }

  /* ================================
     Load Teacher Assignments
  ================================ */
  private loadTeacherAssignments(): void {
    this.loading = true;

    this.teacherProfileService.getMyProfile().subscribe({
      next: (profile) => {
        const teacherId = profile.id;

        this.assignmentService.getAssignments({ teacherId }).subscribe({
          next: (response) => {
            this.assignments = response.results ?? [];
            this.loadSubmissionsForAssignments();
          },
          error: () => {
            this.loading = false;
          },
        });
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  /* ================================
     Load Submissions (Ungraded Only)
  ================================ */

  private loadSubmissionsForAssignments(): void {
    if (!Array.isArray(this.assignments) || this.assignments.length === 0) {
      this.loading = false;
      return;
    }

    this.submissions = [];
    let pendingRequests = this.assignments.length;

    this.assignments.forEach((assignment) => {
      this.assignmentService
        .getSubmissionsByAssignment(assignment.id)
        .subscribe({
          next: (subs) => {
            const ungraded = subs.filter((s) => !s.gradedAt);
            this.submissions.push(...ungraded);
          },
          complete: () => {
            pendingRequests--;
            if (pendingRequests === 0) {
              this.loading = false;
            }
          },
        });
    });
  }

  /* ================================
     Modal Handling
  ================================ */

  openGradeModal(submission: AssignmentSubmission): void {
    this.selectedSubmission = submission;
  }

  closeGradeModal(): void {
    this.selectedSubmission = null;
  }

  onSubmissionGraded(): void {
    this.closeGradeModal();
    this.loadTeacherAssignments();
  }

  // Inside GradeAssignmentsComponent
  getAssignmentTitle(assignmentId: string): string {
    const assignment = this.assignments.find((a) => a.id === assignmentId);
    return assignment ? assignment.title : 'Unknown Assignment';
  }

  getAssignmentCourse(assignmentId: string): string {
    const assignment = this.assignments.find((a) => a.id === assignmentId);
    return assignment ? assignment.courseName : 'Unknown Course';
  }

  getAssignmentTotalMarks(assignmentId: string): number {
    const assignment = this.assignments.find((a) => a.id === assignmentId);
    return assignment ? assignment.totalMarks : 0;
  }
  // Inside GradeAssignmentsComponent
  cardColors = [
    'bg-blue-50',
    'bg-purple-50',
    'bg-green-50',
    'bg-pink-50',
    'bg-yellow-50',
  ];

  cardTextColors = [
    'text-blue-900',
    'text-purple-900',
    'text-green-900',
    'text-pink-900',
    'text-yellow-900',
  ];

  // Button colors matching card background
  getButtonColor(index: number): string {
    const colors = [
      'bg-blue-300 text-blue-900 hover:bg-blue-400 hover:text-white',
      'bg-purple-300 text-purple-900 hover:bg-purple-400 hover:text-white',
      'bg-green-300 text-green-900 hover:bg-green-400 hover:text-white',
      'bg-pink-300 text-pink-900 hover:bg-pink-400 hover:text-white',
      'bg-yellow-300 text-yellow-900 hover:bg-yellow-400 hover:text-white',
    ];
    return colors[index % colors.length];
  }

  cardBackground(index: number): string {
    const bg = this.cardColors[index % this.cardColors.length];
    const text = this.cardTextColors[index % this.cardTextColors.length];
    return `${bg} ${text}`;
  }
}
