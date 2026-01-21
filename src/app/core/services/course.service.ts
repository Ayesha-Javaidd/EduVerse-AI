import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../constants/api.constants';

// Internal interface mapping backend CourseResponse/CourseWithProgress
export interface BackendCourse {
    _id: string;
    id?: string;
    title: string;
    description?: string;
    category: string;
    level?: string;
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
    nextLesson?: string;
    modules?: any[];
    instructorName?: string;
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
    category: string;
    level: string;
    status?: string;
    courseCode?: string;
    teacherId: string;
    tenantId: string;
    thumbnailUrl?: string;
    modules?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class CourseService {

    constructor(private http: HttpClient) { }

    // Helper to get headers (auth token)
    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('eduverse_access_token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    /**
     * Fetch all courses for a specific tenant
     * @param tenantId The tenant ID
     * @param filters Optional search/status/category filters
     */
    getCourses(tenantId: string, filters: CourseFilters = {}): Observable<BackendCourse[]> {
        let params = new HttpParams().set('tenantId', tenantId);

        if (filters.search) params = params.set('search', filters.search);
        if (filters.status) params = params.set('status', filters.status);
        if (filters.category) params = params.set('category', filters.category);
        if (filters.teacher_id) params = params.set('teacher_id', filters.teacher_id);

        return this.http.get<BackendCourse[]>(ENDPOINTS.COURSES.BASE, {
            headers: this.getHeaders(),
            params
        });
    }

    /**
     * Fetch a single course by ID
     */
    getCourseById(courseId: string, tenantId: string): Observable<BackendCourse> {
        const params = new HttpParams().set('tenantId', tenantId);
        return this.http.get<BackendCourse>(ENDPOINTS.COURSES.BY_ID(courseId), {
            headers: this.getHeaders(),
            params
        });
    }

    /**
     * Fetch courses a student is enrolled in
     */
    getStudentCourses(studentId: string, tenantId: string): Observable<BackendCourse[]> {
        const params = new HttpParams().set('tenantId', tenantId);
        return this.http.get<BackendCourse[]>(ENDPOINTS.COURSES.STUDENT_COURSES(studentId), {
            headers: this.getHeaders(),
            params
        });
    }

    /**
     * Enroll a student in a course
     */
    enrollStudent(courseId: string, studentId: string, tenantId: string): Observable<any> {
        return this.http.post(ENDPOINTS.COURSES.ENROLL, { courseId, studentId, tenantId }, {
            headers: this.getHeaders()
        });
    }

    /**
     * Unenroll a student from a course
     */
    unenrollStudent(courseId: string, studentId: string, tenantId: string): Observable<any> {
        return this.http.post(ENDPOINTS.COURSES.UNENROLL, { courseId, studentId, tenantId }, {
            headers: this.getHeaders()
        });
    }

    /**
     * Create a new course (Teacher/Admin)
     */
    createCourse(courseData: CourseCreate): Observable<BackendCourse> {
        return this.http.post<BackendCourse>(ENDPOINTS.COURSES.BASE, courseData, {
            headers: this.getHeaders()
        });
    }

    /**
     * Update an existing course
     */
    updateCourse(courseId: string, tenantId: string, updates: Partial<CourseCreate>): Observable<BackendCourse> {
        const params = new HttpParams().set('tenantId', tenantId);
        return this.http.put<BackendCourse>(ENDPOINTS.COURSES.BY_ID(courseId), updates, {
            headers: this.getHeaders(),
            params
        });
    }

    /**
     * Delete a course
     */
    deleteCourse(courseId: string, tenantId: string): Observable<any> {
        const params = new HttpParams().set('tenantId', tenantId);
        return this.http.delete(ENDPOINTS.COURSES.BY_ID(courseId), {
            headers: this.getHeaders(),
            params
        });
    }
}

