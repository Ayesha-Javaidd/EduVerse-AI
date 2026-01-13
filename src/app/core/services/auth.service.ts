import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ENDPOINTS } from '../constants/api.constants';

export interface User {
    id: string;
    fullName: string;
    email: string;
    role: 'student' | 'teacher' | 'admin' | 'super_admin';
    tenantId?: string;
    studentId?: string; // ID from students collection
    teacherId?: string; // ID from teachers collection
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    constructor(private http: HttpClient) { }

    login(email: string, password: string): Observable<any> {
        // We try to login. The backend returns a token and user details.
        return this.http.post(ENDPOINTS.AUTH.LOGIN, { email, password }).pipe(
            tap((response: any) => {
                if (response && response.access_token) {
                    localStorage.setItem('token', response.access_token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    // Store tenantId specifically for convenience
                    if (response.user && response.user.tenantId) {
                        localStorage.setItem('tenantId', response.user.tenantId);
                    }
                }
            })
        );
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenantId');
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr) as User;
            } catch (e) {
                console.error('Error parsing user data', e);
                return null;
            }
        }
        return null;
    }

    getTenantId(): string | null {
        return localStorage.getItem('tenantId');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}
