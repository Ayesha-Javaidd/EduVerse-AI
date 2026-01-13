import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Teacher Profile Response from GET /teachers/me
 */
export interface TeacherProfile {
  id: string;                    // Teacher's MongoDB _id
  userId: string;                // User's MongoDB _id
  tenantId: string | null;       // Tenant ID at root level (from teachers collection)
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenant_id?: string | null;   // May be null in users collection
    contactNo?: string;
    country?: string;
    profileImageURL?: string;
    status: string;
  };
  assignedCourses: string[];     // Array of course IDs
  qualifications: string[];
  subjects: string[];
  status: string;
  createdAt: string;
  updatedAt?: string;
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
}
