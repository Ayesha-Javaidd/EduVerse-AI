import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ChangePasswordPayload,
  TeacherResponse,
  TeacherUpdatePayload,
} from '../../../shared/models/teacher-profile.models';

/**
 * Teacher Profile Response from GET /teachers/me
 * Note: User data is returned at the root level (merged), not nested in a 'user' object
 */
export interface TeacherProfile {
  id: string; // Teacher's MongoDB _id
  userId?: string; // User's MongoDB _id (if available)
  tenantId: string; // Tenant ID
  fullName: string; // User's full name (at root level)
  email: string; // User's email
  role: string; // 'teacher'
  status: string; // 'active' | 'inactive'
  profileImageURL?: string; // Profile image URL
  contactNo?: string; // Contact number
  country?: string; // Country
  assignedCourses: string[]; // Array of course IDs
  qualifications: string[];
  subjects: string[];
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
  // Legacy nested structure (for backwards compatibility)
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenant_id?: string | null;
    contactNo?: string;
    country?: string;
    profileImageURL?: string;
    status: string;
  };
}

/**
 * TeacherProfileService
 * ---------------------
 * Service to fetch teacher's own profile data.
 * Used to get teacherId and tenantId for quiz operations.
 */
@Injectable({
  providedIn: 'root',
})
export class TeacherProfileService {
  private readonly API_URL = 'http://localhost:8000/teachers';

  constructor(private http: HttpClient) {}

  /**
   * Fetches the current teacher's profile.
   * Requires valid JWT token (handled by auth interceptor).
   * @returns Observable<TeacherProfile> - Teacher's full profile
   */
  getMyProfile(): Observable<TeacherProfile> {
    return this.http.get<TeacherProfile>(`${this.API_URL}/me`);
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

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import {
//   ChangePasswordPayload,
//   TeacherResponse,
//   TeacherUpdatePayload,
// } from '../../../shared/models/teacher-profile.models';

// @Injectable({
//   providedIn: 'root',
// })
// export class TeacherProfileService {
//   private readonly API_URL = 'http://localhost:8000/teachers';

//   constructor(private http: HttpClient) {}

//   /**
//    * GET /teachers/me
//    */
//   getMyProfile(): Observable<TeacherResponse> {
//     return this.http.get<TeacherResponse>(`${this.API_URL}/me`);
//   }

//   /**
//    * PATCH /teachers/me
//    */
//   updateMyProfile(payload: TeacherUpdatePayload): Observable<TeacherResponse> {
//     return this.http.patch<TeacherResponse>(`${this.API_URL}/me`, payload);
//   }

//   /**
//    * PUT /teachers/me/password
//    * Returns 204 No Content
//    */
//   changeMyPassword(payload: ChangePasswordPayload): Observable<void> {
//     return this.http.put<void>(`${this.API_URL}/me/password`, payload);
//   }
// }
