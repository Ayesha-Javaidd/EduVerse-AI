import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../../core/constants/api.constants';
import { AuthService } from '../../auth/services/auth.service';
import { AdaptiveLesson } from '../pages/course-player/course-player.models';

export interface AdaptiveClassification {
    confidence?: number;
    weakAreas?: string[];
    strengths?: string[];
    pace?: string;
    recommendedFocus?: string[];
}

export interface AdaptiveQuizGenerationResponse {
    id?: string;
    quizId?: string;
    courseId?: string;
    lessonId?: string;
    topic?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdaptiveLearningService {
    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getStudentId(): string {
        const user = this.authService.getUser();
        return user?.studentId || '';
    }

    generateAiLesson(
        courseId: string,
        quizId: string | null,
        topic: string,
        weakAreas?: string[],
        scorePercentage?: number,
    ): Observable<AdaptiveLesson> {
        const studentId = this.getStudentId();
        const url = `${ENDPOINTS.ADAPTIVE.GENERATE_LESSON}?student_id=${studentId}`;
        
        return this.http.post<AdaptiveLesson>(
            url,
            { 
                courseId, 
                quizId, 
                topic,
                scorePercentage: scorePercentage !== undefined ? scorePercentage : 100,
                weakAreas: (weakAreas || []).join(', ')
            }
        );
    }

    generateBaseLesson(courseId: string, lessonId: string, topic: string, sourceContent: string): Observable<AdaptiveLesson> {
        const studentId = this.getStudentId();
        const url = `${ENDPOINTS.ADAPTIVE.GENERATE_BASE_LESSON}?student_id=${studentId}`;

        return this.http.post<AdaptiveLesson>(
            url,
            {
                courseId,
                lessonId,
                topic,
                sourceContent
            }
        );
    }

    getStudentLessons(courseId: string): Observable<AdaptiveLesson[]> {
        const studentId = this.getStudentId();
        const url = `${ENDPOINTS.ADAPTIVE.GENERATED_LESSONS(studentId)}?course_id=${courseId}`;
        return this.http.get<AdaptiveLesson[]>(url);
    }

    getLatestClassification(courseId: string): Observable<AdaptiveClassification> {
        const studentId = this.getStudentId();
        const url = `${ENDPOINTS.ADAPTIVE.CLASSIFICATION(studentId)}?course_id=${courseId}`;
        return this.http.get<AdaptiveClassification>(url);
    }

    generateQuiz(courseId: string, topic: string): Observable<AdaptiveQuizGenerationResponse> {
        const studentId = this.getStudentId();
        const url = `${ENDPOINTS.ADAPTIVE.GENERATE_QUIZ}?student_id=${studentId}`;
        return this.http.post<AdaptiveQuizGenerationResponse>(
            url,
            { courseId, topic }
        );
    }
}
