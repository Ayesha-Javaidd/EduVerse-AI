import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../../core/constants/api.constants';

import {
  QuizSubmission,
  QuizSubmissionCreate,
  QuizSummary,
  StudentAnalytics,
} from '../../../shared/models/quiz-submission.model';

/**
 * QuizSubmissionService
 * ---------------------
 * Angular service for quiz submissions (student-facing + analytics).
 * Connects to backend endpoints:
 *   - POST   /quiz-submissions/                    → Submit & auto-grade
 *   - GET    /quiz-submissions/quiz/{quiz_id}      → Get submissions for a quiz
 *   - GET    /quiz-submissions/student/{student_id} → Get submissions by student
 *   - DELETE /quiz-submissions/{id}                → Delete submission
 *   - GET    /quiz-submissions/summary/quiz/{id}   → Quiz summary (teacher)
 *   - GET    /quiz-submissions/analytics/student/{id} → Student analytics
 */
@Injectable({
  providedIn: 'root',
})
export class QuizSubmissionService {
  constructor(private http: HttpClient) {}

  // ========================
  // SUBMIT QUIZ ANSWERS (Auto-Grades)
  // ========================
  /**
   * Submits student's quiz answers for auto-grading.
   * Backend will:
   *   1. Store the submission
   *   2. Compare answers with correct answers
   *   3. Calculate obtainedMarks & percentage
   *   4. Return graded submission
   *
   * @param payload - QuizSubmissionCreate with student answers
   * @returns Observable<QuizSubmission> - Graded submission with score
   */
  submitQuiz(payload: QuizSubmissionCreate): Observable<QuizSubmission> {
    return this.http.post<QuizSubmission>(ENDPOINTS.QUIZ_SUBMISSIONS.BASE, payload);
  }

  // ========================
  // GET SUBMISSIONS BY QUIZ
  // ========================
  /**
   * Fetches all submissions for a specific quiz (teacher view).
   * @param quizId - The quiz's ObjectId
   * @param sort - Optional sort field (e.g., '-submittedAt' for descending)
   * @returns Observable<QuizSubmission[]> - Array of submissions
   */
  getSubmissionsByQuiz(
    quizId: string,
    sort?: string,
  ): Observable<QuizSubmission[]> {
    let params = new HttpParams();
    if (sort) {
      params = params.set('sort', sort);
    }
    return this.http.get<QuizSubmission[]>(`${ENDPOINTS.QUIZ_SUBMISSIONS.BASE}/quiz/${quizId}`, {
      params,
    });
  }

  // ========================
  // GET SUBMISSIONS BY STUDENT
  // ========================
  /**
   * Fetches all submissions by a specific student (student's history).
   * @param studentId - The student's ObjectId
   * @param sort - Optional sort field
   * @returns Observable<QuizSubmission[]> - Array of student's submissions
   */
  getSubmissionsByStudent(
    studentId: string,
    sort?: string,
  ): Observable<QuizSubmission[]> {
    let params = new HttpParams();
    if (sort) {
      params = params.set('sort', sort);
    }
    return this.http.get<QuizSubmission[]>(
      `${ENDPOINTS.QUIZ_SUBMISSIONS.BASE}/student/${studentId}`,
      { params },
    );
  }

  // ========================
  // DELETE SUBMISSION
  // ========================
  /**
   * Deletes a quiz submission.
   * @param submissionId - The submission's ObjectId
   * @returns Observable<{message: string}> - Success message
   */
  deleteSubmission(submissionId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${ENDPOINTS.QUIZ_SUBMISSIONS.BASE}/${submissionId}`,
    );
  }

  // ========================
  // GET QUIZ SUMMARY (Teacher Dashboard)
  // ========================
  /**
   * Gets aggregated statistics for a quiz.
   * Returns: total submissions, average score, top scorers, distribution
   * @param quizId - The quiz's ObjectId
   * @param topN - Number of top scores to return (default: 5)
   * @returns Observable<QuizSummary> - Aggregated quiz stats
   */
  getQuizSummary(quizId: string, topN: number = 5): Observable<QuizSummary> {
    const params = new HttpParams().set('top_n', topN.toString());
    return this.http.get<QuizSummary>(
      `${ENDPOINTS.QUIZ_SUBMISSIONS.BASE}/summary/quiz/${quizId}`,
      {
        params,
      },
    );
  }

  // ========================
  // GET STUDENT ANALYTICS
  // ========================
  /**
   * Gets overall analytics for a student's quiz performance.
   * Returns: total quizzes, average score, recent attempts, accuracy
   * @param studentId - The student's ObjectId
   * @param recent - Number of recent attempts to include
   * @returns Observable<StudentAnalytics> - Student's performance data
   */
  getStudentAnalytics(
    studentId: string,
    recent: number = 5,
  ): Observable<StudentAnalytics> {
    const params = new HttpParams().set('recent', recent.toString());
    return this.http.get<StudentAnalytics>(
      `${ENDPOINTS.QUIZ_SUBMISSIONS.BASE}/analytics/student/${studentId}`,
      { params },
    );
  }
}
