import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ENDPOINTS } from '../constants/api.constants';
import { BackendCourse } from './course.service';
import { AuthService } from '../../features/auth/services/auth.service';

export interface AdminTeacher {
    id?: string;
    _id?: string;
    fullName: string;
    email: string;
    role?: string;
    status: string;
    contactNo?: string;
    country?: string;
    qualifications?: string[];
    subjects?: string[];
    assignedCourses?: string[];
    assignedCoursesCount?: number;
    avatar?: string;
    name?: string;
    password?: string;
    tenantId?: string;
}

export interface AdminStudent {
    id?: string;
    _id?: string;
    fullName: string;
    email: string;
    country?: string;
    contactNo?: string;
    status: string;
    role?: string;
    avatar?: string;
    name?: string;
    password?: string;
    tenantId?: string;
}

export interface SystemSettingsConfig {
    tenantName: string;
    tenantLogoUrl: string;
}

export interface BillingPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    pricePerMonth: number;
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
    currency: string;
    code: string;
    maxStudents: number;
    maxTeachers: number;
    maxCourses: number;
    storageGb: number;
    features?: string[];
}

export interface BillingUsage {
    currentPlan: string;
    plan: BillingPlan;
    usage: {
        students: number;
        teachers: number;
        courses: number;
        storageGb: number;
    };
}

export interface BillingStatus {
    isActive: boolean;
    expiryDate: string | null;
    gracePeriodUntil: string | null;
    status: string;
}

export interface CheckoutResponse {
    clientSecret?: string;
    success?: boolean;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private requireTenantId(): string {
        const tenantId = this.authService.getTenantId();
        if (!tenantId) {
            throw new Error('Tenant context missing for admin request');
        }
        return tenantId;
    }

    // Fetch all teachers (Admin only)
    getTeachers(): Observable<AdminTeacher[]> {
        return this.http.get<{ total: number, teachers: AdminTeacher[] }>(`${ENDPOINTS.ADMINS.BASE}/teachers`, {
        }).pipe(
            map(response => response.teachers || [])
        );
    }

    // Fetch all students (Admin only)
    getStudents(): Observable<AdminStudent[]> {
        return this.http.get<{ total: number, students: AdminStudent[] }>(`${ENDPOINTS.ADMINS.BASE}/students`, {
        }).pipe(
            map(response => response.students || [])
        );
    }

    // Fetch all courses (Admin only)
    getCourses(): Observable<BackendCourse[]> {
        return this.http.get<{ total: number, courses: BackendCourse[] }>(`${ENDPOINTS.ADMINS.BASE}/courses`, {
        }).pipe(
            map(response => response.courses || [])
        );
    }

    // Delete a teacher
    deleteTeacher(teacherId: string): Observable<void> {
        return this.http.delete<void>(`${ENDPOINTS.TEACHERS.BASE}/${teacherId}`, {
        });
    }



    // Create a teacher
    createTeacher(data: Partial<AdminTeacher>): Observable<AdminTeacher> {
        return this.http.post<AdminTeacher>(`${ENDPOINTS.TEACHERS.BASE}/`, data, {
        });
    }

    // Update a teacher
    updateTeacher(teacherId: string, data: Partial<AdminTeacher>): Observable<AdminTeacher> {
        // Remove id/_id from payload to avoid 422
        const { id, _id, ...updateData } = data;
        // Backend admin update teacher endpoint is /admin/update-teacher/{id}
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.put<AdminTeacher>(`${baseUrl}/update-teacher/${teacherId}`, updateData, {
        });
    }

    // Create a student
    createStudent(data: Partial<AdminStudent>): Observable<AdminStudent> {
        const { id, _id, role, tenantId, ...createData } = data as AdminStudent;
        return this.http.post<AdminStudent>(`${ENDPOINTS.STUDENTS.BASE.replace('/students', '/auth/student/signup')}`, createData, {
        });
    }

    // Update a student
    updateStudent(studentId: string, data: Partial<AdminStudent>): Observable<AdminStudent> {
        // Remove id/_id from payload
        const { id, _id, ...updateData } = data as AdminStudent; // cast back from partial because we are destructing _id safely
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.patch<AdminStudent>(`${baseUrl}/students/${studentId}`, updateData, {
        });
    }

    // Delete a student
    deleteStudent(studentId: string): Observable<void> {
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.delete<void>(`${baseUrl}/students/${studentId}`, {
        });
    }

    // Create a course
    createCourse(data: Partial<BackendCourse>): Observable<BackendCourse> {
        return this.http.post<BackendCourse>(`${ENDPOINTS.COURSES.BASE}/`, data, {
        });
    }

    // Update a course
    updateCourse(courseId: string, data: Partial<BackendCourse>): Observable<BackendCourse> {
        // Remove id/_id from payload
        const { id, _id, instructorName, enrolledStudents, ...updateData } = data as BackendCourse;
        const tenantId = this.requireTenantId();
        return this.http.put<BackendCourse>(`${ENDPOINTS.COURSES.BASE}/${courseId}?tenantId=${tenantId}`, updateData, {
        });
    }

    // Delete a course
    deleteCourse(courseId: string): Observable<void> {
        const tenantId = this.requireTenantId();
        return this.http.delete<void>(`${ENDPOINTS.COURSES.BASE}/${courseId}?tenantId=${tenantId}`, {
        });
    }

    // --- System Settings ---
    getSystemSettings(): Observable<SystemSettingsConfig> {
        // ENDPOINTS.ADMINS.BASE is /admin/dashboard, so we need to target /admin/settings/system
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.get<SystemSettingsConfig>(`${baseUrl}/settings/system`, {
        });
    }

    updateSystemSettings(data: SystemSettingsConfig): Observable<SystemSettingsConfig> {
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.put<SystemSettingsConfig>(`${baseUrl}/settings/system`, data, {
        });
    }

    // --- Billing & Usage ---
    getBillingUsage(): Observable<BillingUsage> {
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.get<BillingUsage>(`${baseUrl}/billing/usage`, {
        });
    }

    getBillingStatus(): Observable<BillingStatus> {
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.get<BillingStatus>(`${baseUrl}/billing/status`, {
        });
    }

    getAvailablePlans(): Observable<BillingPlan[]> {
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.get<BillingPlan[]>(`${baseUrl}/billing/plans`, {
        });
    }

    createSubscriptionCheckout(planId: string): Observable<CheckoutResponse> {
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.post<CheckoutResponse>(`${baseUrl}/billing/checkout`, { planId }, {
        });
    }
}
