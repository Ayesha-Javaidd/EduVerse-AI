import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../core/constants/api.constants';
import {
  ChangePasswordPayload,
  StudentProfile,
  StudentUpdatePayload,
} from '../models/student-profile.models';

@Injectable({
  providedIn: 'root',
})
export class StudentProfileService {
  constructor(private http: HttpClient) {}

  /**
   * GET /students/me
   * Fetch the authenticated student's profile
   */
  getMyProfile(): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(ENDPOINTS.STUDENTS.ME);
  }

  /**
   * PATCH /students/me
   * Update student's own profile
   */
  updateMyProfile(payload: StudentUpdatePayload): Observable<StudentProfile> {
    return this.http.patch<StudentProfile>(ENDPOINTS.STUDENTS.ME, payload);
  }

  /**
   * PUT /students/me/password
   * Change student's password
   */
  changeMyPassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.put<void>(ENDPOINTS.STUDENTS.PASSWORD, payload);
  }
}
