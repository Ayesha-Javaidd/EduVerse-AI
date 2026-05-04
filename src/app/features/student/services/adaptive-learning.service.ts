import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, timeout } from 'rxjs';
import { ENDPOINTS } from '../../../core/constants/api.constants';
import { AuthService } from '../../auth/services/auth.service';
import { AdaptiveLesson } from '../pages/course-player/course-player.models';
import { CourseProgress } from './student-progress.service';

// Module-level set prevents two component instances (e.g. two tabs) from
// firing duplicate generate-base-lesson calls for the same lesson at the
// same time. Entries are removed when the call completes or errors.
const _inFlightBaseLessons = new Set<string>();

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

export interface AdaptiveGenerateResponse {
    content: string;
    final_score: number;
    final_verdict: string;
    worker_model: string;
    latency_ms: number;
    layer1: unknown;
    layer2_rag: unknown;
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
        lessonId: string,
        quizId: string | null,
        topic: string,
        lessonDescription: string,
        studentProgress: CourseProgress | null,
        weakAreas?: string[],
        scorePercentage?: number,
    ): Observable<AdaptiveLesson> {
        const studentId = this.getStudentId();
        const url = `${ENDPOINTS.ADAPTIVE.GENERATE_LESSON}?student_id=${studentId}`;
        
        return this.http.post<AdaptiveLesson>(
            url,
            { 
                courseId, 
                lessonId,
                quizId, 
                topic,
                lessonDescription,
                sourceContent: lessonDescription,
                studentProgress: studentProgress
                    ? {
                        progressPercentage: studentProgress.progressPercentage,
                        completedLessons: studentProgress.completedLessons,
                        isCompleted: studentProgress.isCompleted,
                        lastAccessedAt: studentProgress.lastAccessedAt,
                    }
                    : null,
                scorePercentage: scorePercentage !== undefined ? scorePercentage : 100,
                weakAreas: (weakAreas || []).join(', ')
            }
        );
    }

    generateBaseLesson(courseId: string, lessonId: string, topic: string, sourceContent: string): Observable<AdaptiveLesson> {
        const studentId = this.getStudentId();
        const inflightKey = `${studentId}:${lessonId}`;

        // Deduplicate: if a call for this exact lesson is already in-flight,
        // return an error observable immediately rather than starting a second
        // concurrent Ollama generation that would OOM the backend.
        if (_inFlightBaseLessons.has(inflightKey)) {
            return throwError(() => new Error('Base lesson generation already in progress for this lesson.'));
        }
        _inFlightBaseLessons.add(inflightKey);

        const url = `${ENDPOINTS.ADAPTIVE.GENERATE_BASE_LESSON}?student_id=${studentId}`;

        return new Observable<AdaptiveLesson>(observer => {
            this.http.post<AdaptiveLesson>(url, { courseId, lessonId, topic, sourceContent })
                .subscribe({
                    next: (lesson) => {
                        _inFlightBaseLessons.delete(inflightKey);
                        observer.next(lesson);
                        observer.complete();
                    },
                    error: (err) => {
                        _inFlightBaseLessons.delete(inflightKey);
                        observer.error(err);
                    },
                });
        });
    }

    generateAdaptiveContent(
        topic: string,
        taskType: 'lesson' | 'mcq' | 'tutor',
        studentLevel: 'slow' | 'average' | 'fast',
        tenantId: string,
        courseId: string,
        lessonId?: string,
        studentId?: string
    ): Observable<AdaptiveGenerateResponse> {
        const payload = {
            topic,
            task_type: taskType,
            student_level: studentLevel,
            tenant_id: tenantId,
            course_id: courseId,
            lesson_id: lessonId || '',
            student_id: studentId || this.getStudentId() || '',
        };

        return this.http.post<AdaptiveGenerateResponse>(
            ENDPOINTS.ADAPTIVE.GENERATE,
            payload
        ).pipe(
            timeout(180000)
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
