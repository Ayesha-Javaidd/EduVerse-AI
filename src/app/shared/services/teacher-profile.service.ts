import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../core/constants/api.constants';
import {
  ChangePasswordPayload,
  TeacherResponse,
  TeacherUpdatePayload,
} from '../models/teacher-profile.models';

export interface TeacherDashboardMetrics {
  totalCourses: number;
  totalQuizLessons: number;
}

@Injectable({
  providedIn: 'root',
})
export class TeacherProfileService {
  private readonly API_URL = ENDPOINTS.TEACHERS.BASE;

  constructor(private http: HttpClient) {}

  /**
   * GET /teachers/me
   */
  getMyProfile(): Observable<TeacherResponse> {
    return this.http.get<TeacherResponse>(`${this.API_URL}/me`);
  }

  /**
   * PATCH /teachers/me
   */
  updateMyProfile(payload: TeacherUpdatePayload): Observable<TeacherResponse> {
    return this.http.patch<TeacherResponse>(`${this.API_URL}/me`, payload);
  }

  /**
   * PUT /teachers/me/password
   * Returns 204 No Content
   */
  changeMyPassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/me/password`, payload);
  }

  getTeacherDashboard(teacherId: string): Observable<TeacherDashboardMetrics> {
    return this.http.get<TeacherDashboardMetrics>(`${this.API_URL}/${teacherId}/dashboard`);
  }
}
