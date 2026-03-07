import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ChangePasswordPayload,
  StudentProfile,
  StudentUpdatePayload,
} from '../models/student-profile.models';

@Injectable({
  providedIn: 'root',
})
export class StudentProfileService {
  private readonly API_URL = 'http://localhost:8000/students';

  constructor(private http: HttpClient) {}

  /**
   * GET /students/me
   * Fetch the authenticated student's profile
   */
  getMyProfile(): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(`${this.API_URL}/me`);
  }

  /**
   * PATCH /students/me
   * Update student's own profile
   */
  updateMyProfile(payload: StudentUpdatePayload): Observable<StudentProfile> {
    return this.http.patch<StudentProfile>(`${this.API_URL}/me`, payload);
  }

  /**
   * PUT /students/me/password
   * Change student's password
   */
  changeMyPassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/me/password`, payload);
  }
}
