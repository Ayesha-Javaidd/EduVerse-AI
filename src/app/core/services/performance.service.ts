import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    attendance: number;
    progress: number;
    lastUpdated?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PerformanceService {

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('eduverse_access_token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    // Get performance for a specific student (Student view)
    getStudentPerformance(studentId: string, tenantId: string): Observable<StudentPerformance[]> {
        return this.http.get<StudentPerformance[]>(`${ENDPOINTS.PERFORMANCE.BASE}/${studentId}?tenantId=${tenantId}`, {
            headers: this.getHeaders()
        });
    }

    // Get performances for a specific teacher's courses
    getTeacherPerformances(teacherId: string, tenantId: string): Observable<StudentPerformance[]> {
        return this.http.get<StudentPerformance[]>(`${ENDPOINTS.PERFORMANCE.BASE}/teacher/${teacherId}?tenantId=${tenantId}`, {
            headers: this.getHeaders()
        });
    }

    // Get performances for a tenant (Admin view)
    getTenantPerformances(tenantId: string, params?: { student_id?: string, course_id?: string }): Observable<StudentPerformance[]> {
        let url = `${ENDPOINTS.PERFORMANCE.BASE}/?tenantId=${tenantId}`;
        if (params?.student_id) url += `&student_id=${params.student_id}`;
        if (params?.course_id) url += `&course_id=${params.course_id}`;

        return this.http.get<StudentPerformance[]>(url, {
            headers: this.getHeaders()
        });
    }

    // Create or update performance
    savePerformance(performance: StudentPerformance): Observable<StudentPerformance> {
        if (performance._id) {
            return this.http.put<StudentPerformance>(`${ENDPOINTS.PERFORMANCE.BASE}/${performance._id}?tenantId=${performance.tenantId}`, performance, {
                headers: this.getHeaders()
            });
        } else {
            return this.http.post<StudentPerformance>(`${ENDPOINTS.PERFORMANCE.BASE}/?tenantId=${performance.tenantId}`, performance, {
                headers: this.getHeaders()
            });
        }
    }
}
