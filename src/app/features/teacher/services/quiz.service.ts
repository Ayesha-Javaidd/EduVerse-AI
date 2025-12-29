import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Quiz,
  QuizCreate,
  QuizUpdate,
  QuizListParams,
} from '../../../shared/models/quiz.model';

/**
 * QuizService
 * -----------
 * Angular service for managing quizzes (teacher-facing).
 * Connects to backend endpoints:
 *   - POST   /quizzes/           → Create quiz
 *   - GET    /quizzes/           → List quizzes (with filters)
 *   - GET    /quizzes/{id}       → Get single quiz
 *   - PATCH  /quizzes/{id}       → Update quiz
 *   - DELETE /quizzes/{id}       → Delete quiz
 */
@Injectable({
  providedIn: 'root',
})
export class QuizService {
  // Base URL for quiz endpoints (adjust for production)
  private readonly API_URL = 'http://localhost:8000/quizzes';

  constructor(private http: HttpClient) {}

  // ========================
  // CREATE QUIZ
  // ========================
  /**
   * Creates a new quiz in the database.
   * @param payload - QuizCreate object with all required fields
   * @returns Observable<Quiz> - The created quiz with ID and timestamps
   */
  createQuiz(payload: QuizCreate): Observable<Quiz> {
    return this.http.post<Quiz>(this.API_URL, payload);
  }

  // ========================
  // GET ALL QUIZZES (with filters)
  // ========================
  /**
   * Fetches quizzes with optional filtering, searching, sorting, and pagination.
   * @param params - Optional QuizListParams for filtering
   * @returns Observable<Quiz[]> - Array of quizzes matching criteria
   */
  getQuizzes(params?: QuizListParams): Observable<Quiz[]> {
    let httpParams = new HttpParams();

    if (params) {
      // Add each parameter if provided
      if (params.tenant_id) {
        httpParams = httpParams.set('tenant_id', params.tenant_id);
      }
      if (params.teacher_id) {
        httpParams = httpParams.set('teacher_id', params.teacher_id);
      }
      if (params.course_id) {
        httpParams = httpParams.set('course_id', params.course_id);
      }
      if (params.search) {
        httpParams = httpParams.set('search', params.search);
      }
      if (params.sort) {
        httpParams = httpParams.set('sort', params.sort);
      }
      if (params.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.limit) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }
    }

    return this.http.get<Quiz[]>(this.API_URL, { params: httpParams });
  }

  // ========================
  // GET SINGLE QUIZ BY ID
  // ========================
  /**
   * Fetches a single quiz by its MongoDB ObjectId.
   * @param quizId - The quiz's ObjectId as string
   * @returns Observable<Quiz> - The quiz details
   */
  getQuizById(quizId: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.API_URL}/${quizId}`);
  }

  // ========================
  // UPDATE QUIZ
  // ========================
  /**
   * Updates an existing quiz (partial update).
   * Only the quiz's owner teacher can update it.
   * @param quizId - The quiz's ObjectId
   * @param teacherId - The teacher's ObjectId (for authorization)
   * @param updates - QuizUpdate object with fields to update
   * @returns Observable<Quiz> - The updated quiz
   */
  updateQuiz(
    quizId: string,
    teacherId: string,
    updates: QuizUpdate
  ): Observable<Quiz> {
    // Backend expects teacher_id as query param for authorization
    const params = new HttpParams().set('teacher_id', teacherId);
    return this.http.patch<Quiz>(`${this.API_URL}/${quizId}`, updates, {
      params,
    });
  }

  // ========================
  // DELETE QUIZ
  // ========================
  /**
   * Soft-deletes a quiz (sets isDeleted=true in backend).
   * Only the quiz's owner teacher can delete it.
   * @param quizId - The quiz's ObjectId
   * @param teacherId - The teacher's ObjectId (for authorization)
   * @returns Observable<{message: string}> - Success message
   */
  deleteQuiz(
    quizId: string,
    teacherId: string
  ): Observable<{ message: string }> {
    const params = new HttpParams().set('teacher_id', teacherId);
    return this.http.delete<{ message: string }>(`${this.API_URL}/${quizId}`, {
      params,
    });
  }
}
