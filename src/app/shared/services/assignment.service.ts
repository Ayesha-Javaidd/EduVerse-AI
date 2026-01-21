import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENDPOINTS } from '../../core/constants/api.constants';

import {
  Assignment,
  AssignmentCreatePayload,
  AssignmentUpdatePayload,
} from '../models/assignment.model';

import {
  AssignmentQueryParams,
  PaginatedAssignmentsResponse,
} from '../models/assignment-query.model';

import {
  AssignmentSubmission,
  AssignmentSubmissionCreatePayload,
  AssignmentSubmissionGradePayload,
} from '../models/assignment-submission.model';

@Injectable({
  providedIn: 'root',
})
export class AssignmentService {
  constructor(private http: HttpClient) {}

  /* ================================
     Assignments (CRUD)
  ================================ */

  createAssignment(payload: AssignmentCreatePayload): Observable<Assignment> {
    return this.http.post<Assignment>(`${ENDPOINTS.ASSIGNMENTS.BASE}`, payload);
  }

  getAssignments(
    params: AssignmentQueryParams,
  ): Observable<PaginatedAssignmentsResponse> {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedAssignmentsResponse>(
      `${ENDPOINTS.ASSIGNMENTS.BASE}/`,
      { params: httpParams },
    );
  }

  getAssignmentById(id: string): Observable<Assignment> {
    return this.http.get<Assignment>(`${ENDPOINTS.ASSIGNMENTS.BY_ID(id)}`);
  }

  updateAssignment(
    id: string,
    payload: AssignmentUpdatePayload,
  ): Observable<Assignment> {
    return this.http.put<Assignment>(
      `${ENDPOINTS.ASSIGNMENTS.BY_ID(id)}`,
      payload,
    );
  }

  deleteAssignment(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${ENDPOINTS.ASSIGNMENTS.BY_ID(id)}`,
    );
  }

  /* ================================
     Assignment Submissions
  ================================ */

  submitAssignment(
    payload: AssignmentSubmissionCreatePayload,
  ): Observable<AssignmentSubmission> {
    return this.http.post<AssignmentSubmission>(
      ENDPOINTS.ASSIGNMENT_SUBMISSIONS.BASE,
      payload,
    );
  }

  getMySubmissions(): Observable<AssignmentSubmission[]> {
    return this.http.get<AssignmentSubmission[]>(
      ENDPOINTS.ASSIGNMENT_SUBMISSIONS.BY_STUDENT,
    );
  }

  getSubmissionsByAssignment(
    assignmentId: string,
  ): Observable<AssignmentSubmission[]> {
    return this.http.get<AssignmentSubmission[]>(
      ENDPOINTS.ASSIGNMENT_SUBMISSIONS.BY_ASSIGNMENT(assignmentId),
    );
  }

  gradeSubmission(
    submissionId: string,
    payload: AssignmentSubmissionGradePayload,
  ): Observable<AssignmentSubmission> {
    return this.http.put<AssignmentSubmission>(
      ENDPOINTS.ASSIGNMENT_SUBMISSIONS.SUBMISSION(submissionId),
      payload,
    );
  }

  deleteSubmission(submissionId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      ENDPOINTS.ASSIGNMENT_SUBMISSIONS.SUBMISSION(submissionId),
    );
  }
}
