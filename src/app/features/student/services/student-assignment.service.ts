// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { ENDPOINTS } from '../../../core/constants/api.constants';
// import { AssignmentSubmission } from '../../../shared/models/assignment-submission.model';
// @Injectable({
//   providedIn: 'root',
// })
// export class StudentAssignmentService {
//   constructor(private http: HttpClient) {}

//   // Submit assignment
//   submitAssignment(data: {
//     assignmentId: string;
//     courseId: string;
//     fileUrl: string;
//   }): Observable<AssignmentSubmission> {
//     return this.http.post<AssignmentSubmission>(
//       ENDPOINTS.ASSIGNMENT_SUBMISSIONS.BASE,
//       data,
//     );
//   }

//   // Get all submissions by current student
//   getMySubmissions(): Observable<AssignmentSubmission[]> {
//     return this.http.get<AssignmentSubmission[]>(
//       ENDPOINTS.ASSIGNMENT_SUBMISSIONS.BY_STUDENT,
//     );
//   }
// }
