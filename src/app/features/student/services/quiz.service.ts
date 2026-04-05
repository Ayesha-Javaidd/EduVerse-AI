import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/constants/api.constants';

export interface QuizQuestion {
    question: string;
    options: string[];
    answer?: string;
    correctAnswer?: string;
}

export interface Quiz {
    id: string;
    courseId: string;
    lessonId?: string;
    topic?: string;
    quizNumber?: number;
    description?: string;
    questions: QuizQuestion[];
    totalMarks?: number;
    timeLimitMinutes?: number;
    generatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class QuizService {
    private baseUrl = `${API_BASE_URL}/quizzes`;

    constructor(private http: HttpClient) { }

    getQuizById(quizId: string): Observable<Quiz> {
        return this.http.get<Quiz>(`${this.baseUrl}/${quizId}`);
    }

    getMyQuizzes(): Observable<Quiz[]> {
        return this.http.get<Quiz[]>(`${this.baseUrl}/student/me`).pipe(
            map((quizzes) =>
                quizzes.map((quiz) => ({
                    ...quiz,
                    description: quiz.description || quiz.topic,
                    totalMarks: quiz.totalMarks ?? quiz.questions?.length ?? 0,
                }))
            )
        );
    }
}
