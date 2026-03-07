import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminChangePasswordPayload,
  AdminProfile,
  AdminUpdateProfilePayload,
} from '../models/admin-profile.models';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly API_URL = 'http://localhost:8000/admin';

  constructor(private http: HttpClient) {}

  /**
   * Fetch logged-in admin profile
   * GET /admin/me
   */
  getMyProfile(): Observable<AdminProfile> {
    return this.http.get<AdminProfile>(`${this.API_URL}/me`);
  }

  /**
   * Update admin profile
   * PATCH /admin/me
   */
  updateMyProfile(
    payload: AdminUpdateProfilePayload,
  ): Observable<AdminProfile> {
    return this.http.patch<AdminProfile>(`${this.API_URL}/me`, payload);
  }

  /**
   * Change admin password
   * PUT /admin/me/password
   * Returns 204 No Content
   */
  changePassword(payload: AdminChangePasswordPayload): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/me/password`, payload);
  }
}
