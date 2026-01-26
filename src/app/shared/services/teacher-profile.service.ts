import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ChangePasswordPayload,
  TeacherResponse,
  TeacherUpdatePayload,
} from '../models/teacher-profile.models';

@Injectable({
  providedIn: 'root',
})
export class TeacherProfileService {
  private readonly API_URL = 'http://localhost:8000/teachers';

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
}
