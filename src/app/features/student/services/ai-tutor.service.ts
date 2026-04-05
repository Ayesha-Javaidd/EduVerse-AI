import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../../core/constants/api.constants';

export interface AiTutorMessageResponse {
  response?: string;
  reply?: string;
  message?: string;
  content?: string;
}

export interface AiTutorSessionClearResponse {
  success?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiTutorService {
  constructor(private http: HttpClient) {}

  sendMessage(message: string, courseId: string, lessonId?: string): Observable<AiTutorMessageResponse> {
    return this.http.post<AiTutorMessageResponse>(
      ENDPOINTS.AI_TUTOR.CHAT,
      { message, courseId, lessonId }
    );
  }

  clearSession(courseId: string): Observable<AiTutorSessionClearResponse> {
    return this.http.delete<AiTutorSessionClearResponse>(ENDPOINTS.AI_TUTOR.SESSION(courseId));
  }
}
