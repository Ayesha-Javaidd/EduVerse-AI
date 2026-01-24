import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ChangePasswordPayload,
  StudentUpdatePayload,
} from '../../../shared/models/student-profile.models';

export interface StudentProfile {
  id: string; // Student's MongoDB _id
  userId: string; // User's MongoDB _id
  tenantId: string | null; // Tenant ID at root level (from students collection)
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenant_id?: string | null; // May be null in users collection
    contactNo?: string;
    country?: string;
    profileImageURL?: string;
    status: string;
  };
  enrolledCourses: string[]; // Array of course IDs
  completedCourses: string[];
  status: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * StudentProfileService
 * ---------------------
 * Service to fetch student's own profile data.
 * Used to get studentId and tenantId for quiz and assignments submissions.
 */

@Injectable({
  providedIn: 'root',
})
export class StudentProfileService {
  private readonly API_URL = 'http://localhost:8000/students';

  constructor(private http: HttpClient) {}

  /**
   * Fetches the current student's profile.
   * Requires valid JWT token (handled by auth interceptor).
   * @returns Observable<StudentProfile> - Student's full profile
   */
  getMyProfile(): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(`${this.API_URL}/me`);
  }

  updateMyProfile(payload: StudentUpdatePayload): Observable<StudentProfile> {
    return this.http.patch<StudentProfile>(`${this.API_URL}/me`, payload);
  }

  changeMyPassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/me/password`, payload);
  }
}
