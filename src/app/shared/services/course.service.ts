import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Course, CourseListParams } from '../models/course.model';

/**
 * CourseService
 * -------------
 * Angular service for fetching courses.
 * Used by both teacher and student features to get available courses.
 */
@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private readonly API_URL = 'http://localhost:8000/courses';

  constructor(private http: HttpClient) {}

  /**
   * Fetches courses with required tenantId and optional filters.
   * @param params - CourseListParams with tenantId required
   * @returns Observable<Course[]> - Array of courses
   */
  getCourses(params: CourseListParams): Observable<Course[]> {
    let httpParams = new HttpParams().set('tenantId', params.tenantId);

    if (params.teacher_id) {
      httpParams = httpParams.set('teacher_id', params.teacher_id);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.category) {
      httpParams = httpParams.set('category', params.category);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.skip !== undefined) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<any[]>(this.API_URL, { params: httpParams }).pipe(
      map(courses => courses.map(course => ({
        ...course,
        id: course.id || course._id,  // Handle both id and _id from backend
      })))
    );
  }

  /**
   * Fetches a single course by ID.
   * @param courseId - The course's ObjectId
   * @param tenantId - The tenant's ObjectId (required)
   * @returns Observable<Course> - The course details
   */
  getCourseById(courseId: string, tenantId: string): Observable<Course> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http.get<Course>(`${this.API_URL}/${courseId}`, { params });
  }
}
