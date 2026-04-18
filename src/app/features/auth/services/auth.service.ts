import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { LoginRequest } from '../models/login-request.model';
import {
  UserSignupRequest,
  AdminSignupRequest,
} from '../models/signup-request.model';
import { AuthResponse } from '../models/auth-response.model';
import { JwtPayload, User } from '../models/user.model';
import { ENDPOINTS, API_BASE_URL } from '../../../core/constants/api.constants';
import { STORAGE_KEYS } from '../../../core/constants/app.constants';
export type { JwtPayload, User };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.restoreSession();
  }

  // ============================
  // PUBLIC METHODS
  // ============================

  login(payload: LoginRequest): Observable<AuthResponse> {
    const body = new URLSearchParams();
    body.set('username', payload.email); // backend uses "username"
    body.set('password', payload.password);
    body.set('grant_type', 'password');

    return this.http
      .post<AuthResponse>(ENDPOINTS.AUTH.TOKEN, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .pipe(tap((res) => this.handleAuthSuccess(res.access_token)));
  }

  signup(
    payload: UserSignupRequest | AdminSignupRequest | Record<string, unknown>,
    role: 'student' | 'teacher' | 'admin',
  ): Observable<unknown> {
    let url = '';
    switch (role) {
      case 'student':
        url = ENDPOINTS.AUTH.STUDENT_SIGNUP;
        break;
      case 'teacher':
        url = ENDPOINTS.AUTH.TEACHER_SIGNUP;
        break;
      case 'admin':
        url = ENDPOINTS.AUTH.ADMIN_SIGNUP;
        break;
      default:
        throw new Error('Invalid role for signup');
    }

    return this.http.post(url, payload);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TENANT_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.STUDENT_ID);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.currentUserSubject.value;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(updates: Partial<User>): void {
    const currentUser = this.currentUserSubject.value;

    if (!currentUser) {
      return;
    }

    const updatedUser = {
      ...currentUser,
      ...updates,
    };
    this.currentUserSubject.next(updatedUser);
  }

  getRole(): User['role'] | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  getTenantId(): string | null {
    if (this.currentUserSubject.value?.role === 'student') {
      return null;
    }
    return this.currentUserSubject.value?.tenantId ?? null;
  }

  // ============================
  // PRIVATE HELPERS
  // ============================

  private restoreSession(): void {
    const token = this.getAccessToken();
    if (!token) return;

    const payload = this.decodeJwt(token);

    if (this.isTokenExpired(payload)) {
      this.logout();
      return;
    }

    const user = this.mapJwtToUser(payload);

    if (user.tenantId) {
      localStorage.setItem(STORAGE_KEYS.TENANT_ID, user.tenantId);
    }
    if (user.id) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, user.id);
    }
    if (user.studentId) {
      localStorage.setItem(STORAGE_KEYS.STUDENT_ID, user.studentId);
    }

    // Set user first so the header renders, then fetch fresh profile pic
    this.currentUserSubject.next(user);
    this.fetchAndPatchProfileImage(user.role);
  }

  private handleAuthSuccess(token: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);

    const payload = this.decodeJwt(token);

    if (this.isTokenExpired(payload)) {
      this.logout();
      return;
    }

    const user = this.mapJwtToUser(payload);
    if (user.tenantId) {
      localStorage.setItem(STORAGE_KEYS.TENANT_ID, user.tenantId);
    }
    if (user.id) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, user.id);
    }
    if (user.studentId) {
      localStorage.setItem(STORAGE_KEYS.STUDENT_ID, user.studentId);
    }

    // Set user first so the header renders, then fetch fresh profile pic
    this.currentUserSubject.next(user);
    this.fetchAndPatchProfileImage(user.role);
    this.redirectByRole(user.role);
  }

  /**
   * Fetches the latest profile from the backend and patches only the
   * profileImageURL and fullName onto the current user in the subject.
   * This is the correct fix for profile pics not persisting:
   * - We do NOT rely on localStorage (Data URLs exceed the 5MB quota)
   * - We do NOT embed the image in the JWT (bloats auth headers)
   * - We simply ask the backend on every load: "what is my current profile pic?"
   */
  private fetchAndPatchProfileImage(role: User['role']): void {
    let url = '';
    switch (role) {
      case 'student':
        url = ENDPOINTS.STUDENTS.ME;
        break;
      case 'teacher':
        url = `${ENDPOINTS.TEACHERS.BASE}/me`;
        break;
      case 'admin':
        url = `${API_BASE_URL}/admin/me`;
        break;
      case 'super_admin':
        url = `${API_BASE_URL}/super-admin/me`;
        break;
    }

    if (!url) return;

    this.http.get<any>(url).subscribe({
      next: (profile) => {
        // Patch only the fields that come from the profile, leaving
        // everything else (role, tenantId, etc.) intact.
        const current = this.currentUserSubject.value;
        if (current) {
          this.currentUserSubject.next({
            ...current,
            fullName: profile.fullName || current.fullName,
            profileImageURL: profile.profileImageURL || current.profileImageURL,
          });
        }
      },
      error: (err) => {
        console.warn('[AuthService] Could not fetch profile for pic sync:', err?.status);
      },
    });
  }

  private decodeJwt(token: string): JwtPayload {
    return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
  }

  private mapJwtToUser(payload: JwtPayload): User {
    return {
      id: payload.user_id,
      email: payload.email ?? '',
      role: payload.role,
      tenantId: payload.tenant_id,
      studentId: payload.student_id,
      teacherId: payload.teacher_id,
      adminId: payload.admin_id,
      fullName: payload.full_name,
      profileImageURL: payload.profileImageURL ?? payload.profile_image_url,
    };
  }

  private isTokenExpired(payload: JwtPayload): boolean {
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  private redirectByRole(role: User['role']): void {
    switch (role) {
      case 'student':
        this.router.navigate(['/student/dashboard']);
        break;
      case 'teacher':
        this.router.navigate(['/teacher/dashboard']);
        break;
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'super_admin':
        this.router.navigate(['/super-admin/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}