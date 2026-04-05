import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../constants/api.constants';

export interface StudentPerformance {
    _id?: string;
    studentId: string;
    courseId: string;
    tenantId: string;
    studentName?: string;
    courseName?: string;
    marks: number;
    totalMarks: number;
    grade: string;
    progress: number;
    lastUpdated?: string;
}

export interface GenericScoreItem {
    id: string;
    title: string;
    score: number | string;
    total: number;
    scoreDisplay: string;
}

export interface DetailedCoursePerformance {
    courseId: string;
    courseName: string;
    studentName: string;
    quizzes: GenericScoreItem[];
}

@Injectable({
    providedIn: 'root'
})
export class PerformanceService {

    constructor(private http: HttpClient) { }

    // Get performance for a specific student (Student view)
    getStudentPerformance(studentId: string, tenantId: string): Observable<StudentPerformance[]> {
        return this.http.get<StudentPerformance[]>(`${ENDPOINTS.PERFORMANCE.BASE}/${studentId}?tenantId=${tenantId}`);
    }

    // Get performances for a specific teacher's courses
    getTeacherPerformances(teacherId: string, tenantId: string): Observable<StudentPerformance[]> {
        return this.http.get<StudentPerformance[]>(`${ENDPOINTS.PERFORMANCE.BASE}/teacher/${teacherId}?tenantId=${tenantId}`);
    }

    // Get detailed aggregate performances for a specific student across a teacher's courses
    getStudentDetailedPerformance(teacherId: string, studentId: string, tenantId: string): Observable<DetailedCoursePerformance[]> {
        return this.http.get<DetailedCoursePerformance[]>(`${ENDPOINTS.PERFORMANCE.BASE}/teacher/${teacherId}/student/${studentId}/details?tenantId=${tenantId}`);
    }

    // Get performances for a tenant (Admin view)
    getTenantPerformances(tenantId: string, params?: { student_id?: string, course_id?: string }): Observable<StudentPerformance[]> {
        let url = `${ENDPOINTS.PERFORMANCE.BASE}/?tenantId=${tenantId}`;
        if (params?.student_id) url += `&student_id=${params.student_id}`;
        if (params?.course_id) url += `&course_id=${params.course_id}`;

        return this.http.get<StudentPerformance[]>(url);
    }

    // Create or update performance
    savePerformance(performance: StudentPerformance): Observable<StudentPerformance> {
        if (performance._id) {
            return this.http.put<StudentPerformance>(`${ENDPOINTS.PERFORMANCE.BASE}/${performance._id}?tenantId=${performance.tenantId}`, performance, {
            });
        } else {
            return this.http.post<StudentPerformance>(`${ENDPOINTS.PERFORMANCE.BASE}/?tenantId=${performance.tenantId}`, performance, {
            });
        }
    }
}
