import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../../core/constants/api.constants';

export interface CourseProgress {
    courseId: string;
    progressPercentage: number;
    completedLessons: string[];
    isCompleted: boolean;
    lastAccessedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class StudentProgressService {
    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('eduverse_access_token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getCourseProgress(courseId: string, tenantId: string): Observable<CourseProgress> {
        const params = new HttpParams().set('tenantId', tenantId);
        return this.http.get<CourseProgress>(`${ENDPOINTS.COURSES.BASE}/progress/${courseId}`, {
            headers: this.getHeaders(),
            params
        });
    }

    markLessonComplete(courseId: string, lessonId: string, tenantId: string): Observable<CourseProgress> {
        const params = new HttpParams().set('tenantId', tenantId);
        return this.http.post<CourseProgress>(`${ENDPOINTS.COURSES.BASE}/progress/mark-complete`,
            { courseId, lessonId },
            { headers: this.getHeaders(), params }
        );
    }

    getAllProgress(tenantId: string): Observable<CourseProgress[]> {
        const params = new HttpParams().set('tenantId', tenantId);
        return this.http.get<CourseProgress[]>(`${ENDPOINTS.COURSES.BASE}/progress/summary/all`, {
            headers: this.getHeaders(),
            params
        });
    }
}
