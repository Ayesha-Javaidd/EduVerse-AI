import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

    getCourseProgress(courseId: string, tenantId?: string): Observable<CourseProgress> {
        let params = new HttpParams();
        if (tenantId) {
            params = params.set('tenantId', tenantId);
        }
        return this.http.get<CourseProgress>(`${ENDPOINTS.COURSES.BASE}/progress/${courseId}`, {
            params
        });
    }

    markLessonComplete(courseId: string, lessonId: string, tenantId?: string): Observable<CourseProgress> {
        let params = new HttpParams();
        if (tenantId) {
            params = params.set('tenantId', tenantId);
        }
        return this.http.post<CourseProgress>(`${ENDPOINTS.COURSES.BASE}/progress/mark-complete`,
            { courseId, lessonId },
            { params }
        );
    }

    getAllProgress(tenantId?: string): Observable<CourseProgress[]> {
        let params = new HttpParams();
        if (tenantId) {
            params = params.set('tenantId', tenantId);
        }
        return this.http.get<CourseProgress[]>(`${ENDPOINTS.COURSES.BASE}/progress/summary/all`, {
            params
        });
    }
}
