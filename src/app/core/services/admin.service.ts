import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ENDPOINTS } from '../constants/api.constants';
import { BackendCourse } from './course.service';

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

export interface CheckoutResponse {
    clientSecret?: string;
    success?: boolean;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('eduverse_access_token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    // Fetch all teachers (Admin only)
    getTeachers(): Observable<AdminTeacher[]> {
        return this.http.get<{ total: number, teachers: AdminTeacher[] }>(`${ENDPOINTS.ADMINS.BASE}/teachers`, {
            headers: this.getHeaders()
        }).pipe(
            map(response => response.teachers || [])
        );
    }

    // Fetch all students (Admin only)
    getStudents(): Observable<AdminStudent[]> {
        return this.http.get<{ total: number, students: AdminStudent[] }>(`${ENDPOINTS.ADMINS.BASE}/students`, {
            headers: this.getHeaders()
        }).pipe(
            map(response => response.students || [])
        );
    }

    // Fetch all courses (Admin only)
    getCourses(): Observable<BackendCourse[]> {
        return this.http.get<{ total: number, courses: BackendCourse[] }>(`${ENDPOINTS.ADMINS.BASE}/courses`, {
            headers: this.getHeaders()
        }).pipe(
            map(response => response.courses || [])
        );
    }

    // Delete a teacher
    deleteTeacher(teacherId: string): Observable<void> {
        return this.http.delete<void>(`${ENDPOINTS.TEACHERS.BASE}/${teacherId}`, {
            headers: this.getHeaders()
        });
    }



    // Create a teacher
    createTeacher(data: Partial<AdminTeacher>): Observable<AdminTeacher> {
        return this.http.post<AdminTeacher>(`${ENDPOINTS.TEACHERS.BASE}/`, data, {
            headers: this.getHeaders()
        });
    }

    // Update a teacher
    updateTeacher(teacherId: string, data: Partial<AdminTeacher>): Observable<AdminTeacher> {
        // Remove id/_id from payload to avoid 422
        const { id, _id, ...updateData } = data;
        // Backend admin update teacher endpoint is /admin/update-teacher/{id}
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.put<AdminTeacher>(`${baseUrl}/update-teacher/${teacherId}`, updateData, {
            headers: this.getHeaders()
        });
    }

    // Create a student
    createStudent(data: Partial<AdminStudent>): Observable<AdminStudent> {
        const tenantId = localStorage.getItem('tenantId');
        return this.http.post<AdminStudent>(`${ENDPOINTS.STUDENTS.BASE}/${tenantId}`, data, {
            headers: this.getHeaders()
        });
    }

    // Update a student
    updateStudent(studentId: string, data: Partial<AdminStudent>): Observable<AdminStudent> {
        const tenantId = localStorage.getItem('tenantId');
        // Remove id/_id from payload
        const { id, _id, ...updateData } = data as AdminStudent; // cast back from partial because we are destructing _id safely
        return this.http.patch<AdminStudent>(`${ENDPOINTS.STUDENTS.BASE}/${tenantId}/${studentId}`, updateData, {
            headers: this.getHeaders()
        });
    }

    // Delete a student
    deleteStudent(studentId: string): Observable<void> {
        const tenantId = localStorage.getItem('tenantId');
        return this.http.delete<void>(`${ENDPOINTS.STUDENTS.BASE}/${tenantId}/${studentId}`, {
            headers: this.getHeaders()
        });
    }

    // Create a course
    createCourse(data: Partial<BackendCourse>): Observable<BackendCourse> {
        return this.http.post<BackendCourse>(`${ENDPOINTS.COURSES.BASE}/`, data, {
            headers: this.getHeaders()
        });
    }

    // Update a course
    updateCourse(courseId: string, data: Partial<BackendCourse>): Observable<BackendCourse> {
        // Remove id/_id from payload
        const { id, _id, instructorName, enrolledStudents, ...updateData } = data as BackendCourse;
        const tenantId = localStorage.getItem('tenantId');
        return this.http.put<BackendCourse>(`${ENDPOINTS.COURSES.BASE}/${courseId}?tenantId=${tenantId}`, updateData, {
            headers: this.getHeaders()
        });
    }

    // Delete a course
    deleteCourse(courseId: string): Observable<void> {
        const tenantId = localStorage.getItem('tenantId');
        return this.http.delete<void>(`${ENDPOINTS.COURSES.BASE}/${courseId}?tenantId=${tenantId}`, {
            headers: this.getHeaders()
        });
    }

    // --- System Settings ---
    getSystemSettings(): Observable<SystemSettingsConfig> {
        // ENDPOINTS.ADMINS.BASE is /admin/dashboard, so we need to target /admin/settings/system
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.get<SystemSettingsConfig>(`${baseUrl}/settings/system`, {
            headers: this.getHeaders()
        });
    }

    updateSystemSettings(data: SystemSettingsConfig): Observable<SystemSettingsConfig> {
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.put<SystemSettingsConfig>(`${baseUrl}/settings/system`, data, {
            headers: this.getHeaders()
        });
    }

    // --- Billing & Usage ---
    getBillingUsage(): Observable<BillingUsage> {
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.get<BillingUsage>(`${baseUrl}/billing/usage`, {
            headers: this.getHeaders()
        });
    }

    getAvailablePlans(): Observable<BillingPlan[]> {
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.get<BillingPlan[]>(`${baseUrl}/billing/plans`, {
            headers: this.getHeaders()
        });
    }

    createSubscriptionCheckout(planId: string): Observable<CheckoutResponse> {
        const baseUrl = ENDPOINTS.ADMINS.BASE.replace('/dashboard', '');
        return this.http.post<CheckoutResponse>(`${baseUrl}/billing/checkout`, { planId }, {
            headers: this.getHeaders()
        });
    }
}
