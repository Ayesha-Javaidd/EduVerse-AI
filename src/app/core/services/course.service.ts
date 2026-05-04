import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../constants/api.constants';
import { Module } from '../../shared/models/course-builder.model';

export interface CourseActionResponse {
    success?: boolean;
    message: string;
    reenrolled?: boolean;
}

// Internal interface mapping backend CourseResponse/CourseWithProgress
export interface BackendCourse {
    _id: string;
    id?: string;
    title: string;
    description?: string;
    category: string;
    level?: 'Beginner' | 'Intermediate' | 'Advanced';
    status: string;
    courseCode?: string;
    duration?: string;
    thumbnailUrl?: string;
    teacherId: string;
    tenantId: string;
    enrolledStudents: number;
    isPublic?: boolean;
    isFree?: boolean;
    price?: number;
    currency?: string;
    createdAt: string;
    updatedAt: string;
    progress?: number;
    lessonsCompleted?: number;
    totalLessons?: number;
    totalDuration?: string;
    nextLesson?: string;
    modules?: Module[];
    instructorName?: string;
    instructorBio?: string;
    hasCertificate?: boolean;
    hasBadges?: boolean;
    hasLifetimeAccess?: boolean;
}

export interface CourseFilters {
    search?: string;
    status?: string;
    category?: string;
    teacher_id?: string;
}

export interface CourseCreate {
    title: string;
    description?: string;
    category?: string;
    level?: string;
    status?: string;
    courseCode?: string;
    teacherId: string;
    tenantId: string;
    thumbnailUrl?: string;
    modules?: Module[];
}

@Injectable({
    providedIn: 'root'
})
export class CourseService {

    constructor(private http: HttpClient) { }

    /**
     * Fetch all courses for a specific tenant
     * @param tenantId The tenant ID
     * @param filters Optional search/status/category filters
     */
    getCourses(tenantId?: string, filters: CourseFilters = {}): Observable<BackendCourse[]> {
        let params = new HttpParams();
        if (tenantId) {
            params = params.set('tenantId', tenantId);
        }

        if (filters.search) params = params.set('search', filters.search);
        if (filters.status) params = params.set('status', filters.status);
        if (filters.category) params = params.set('category', filters.category);
        if (filters.teacher_id) params = params.set('teacher_id', filters.teacher_id);

        return this.http.get<BackendCourse[]>(ENDPOINTS.COURSES.BASE, {
            params
        });
    }

    /**
     * Fetch a single course by ID
     */
    getCourseById(courseId: string, tenantId?: string): Observable<BackendCourse> {
        let params = new HttpParams();
        if (tenantId) {
            params = params.set('tenantId', tenantId);
        }
        return this.http.get<BackendCourse>(ENDPOINTS.COURSES.BY_ID(courseId), {
            params
        });
    }

    /**
     * Fetch courses a student is enrolled in
     */
    getStudentCourses(studentId: string, tenantId?: string): Observable<BackendCourse[]> {
        let params = new HttpParams();
        if (tenantId) {
            params = params.set('tenantId', tenantId);
        }
        return this.http.get<BackendCourse[]>(ENDPOINTS.COURSES.STUDENT_COURSES(studentId), {
            params
        });
    }

    /**
     * Enroll a student in a course
     */
    enrollStudent(courseId: string, studentId: string, tenantId?: string): Observable<CourseActionResponse> {
        const payload: Record<string, string> = { courseId, studentId };
        if (tenantId) {
            payload['tenantId'] = tenantId;
        }
        return this.http.post<CourseActionResponse>(ENDPOINTS.COURSES.ENROLL, payload);
    }

    /**
     * Unenroll a student from a course
     */
    unenrollStudent(courseId: string, studentId: string, tenantId?: string): Observable<CourseActionResponse> {
        const payload: Record<string, string> = { courseId, studentId };
        if (tenantId) {
            payload['tenantId'] = tenantId;
        }
        return this.http.post<CourseActionResponse>(ENDPOINTS.COURSES.UNENROLL, payload);
    }

    /**
     * Create a new course (Teacher/Admin)
     */
    createCourse(courseData: CourseCreate): Observable<BackendCourse> {
        return this.http.post<BackendCourse>(ENDPOINTS.COURSES.BASE, courseData);
    }

    /**
     * Update an existing course
     */
    updateCourse(courseId: string, tenantId: string, updates: Partial<CourseCreate>): Observable<BackendCourse> {
        const params = new HttpParams().set('tenantId', tenantId);
        return this.http.put<BackendCourse>(ENDPOINTS.COURSES.BY_ID(courseId), updates, {
            params
        });
    }

    /**
     * Delete a course
     */
    deleteCourse(courseId: string, tenantId: string): Observable<CourseActionResponse> {
        const params = new HttpParams().set('tenantId', tenantId);
        return this.http.delete<CourseActionResponse>(ENDPOINTS.COURSES.BY_ID(courseId), {
            params
        });
    }

    // Create a Stripe checkout session for a specific course
    createCheckoutSession(courseId: string): Observable<{clientSecret: string}> {
         return this.http.post<{clientSecret: string}>(ENDPOINTS.PAYMENTS.CREATE_PAYMENT_INTENT, { courseId });
    }

    // Confirm a completed Stripe checkout session and trigger enrollment
    confirmCheckoutSession(sessionId: string): Observable<{ status: string; courseId: string; enrolled: boolean }> {
        return this.http.get<{ status: string; courseId: string; enrolled: boolean }>(
            ENDPOINTS.PAYMENTS.CONFIRM_SESSION(sessionId)
        );
    }

    /**
     * Fetch recommended courses for a student
     */
    getRecommendedCourses(studentId: string, limit = 10): Observable<BackendCourse[]> {
        const params = new HttpParams().set('limit', limit.toString());
        return this.http.get<BackendCourse[]>(ENDPOINTS.COURSES.RECOMMENDATIONS(studentId), { params });
    }
}
