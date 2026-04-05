import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/api.constants';

export interface PointsHistoryItem {
  points: number;
  reason: string;
  date: string;
}

export interface CertificateItem {
  title: string;
  file: string;
  date: string;
  courseId?: string;
}

export interface CourseStatItem {
  courseId: string;
  completionPercentage: number;
  lastActive: string;
}

export interface StudentPerformance {
  totalPoints: number;
  pointsThisWeek: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  courseStats: CourseStatItem[];
  pointsHistory: PointsHistoryItem[];
  certificates: CertificateItem[];
}

export interface LeaderboardUser {
  studentId?: string | null;
  rank: number;
  studentName: string;
  points: number;
}

export interface LeaderboardSummary {
  top: LeaderboardUser[];
  currentStudent: LeaderboardUser | null;
  totalStudents: number;
}

@Injectable({
  providedIn: 'root',
})
export class StudentPerformanceService {
  constructor(private http: HttpClient) {}

  getStudentPerformance(tenantId: string, studentId: string): Observable<StudentPerformance> {
    return this.http.get<StudentPerformance>(`${API_BASE_URL}/studentPerformance/${tenantId}/${studentId}`);
  }

  getMyPerformance(): Observable<StudentPerformance> {
    return this.http.get<StudentPerformance>(`${API_BASE_URL}/studentPerformance/me`);
  }

  getTenantTop5(tenantId: string): Observable<LeaderboardUser[]> {
    return this.http.get<LeaderboardUser[]>(`${API_BASE_URL}/studentPerformance/${tenantId}/leaderboard-top5`);
  }

  getTenantLeaderboard(tenantId: string): Observable<LeaderboardUser[]> {
    return this.http.get<LeaderboardUser[]>(`${API_BASE_URL}/studentPerformance/${tenantId}/leaderboard`);
  }

  getGlobalLeaderboard(): Observable<LeaderboardUser[]> {
    return this.http.get<LeaderboardUser[]>(`${API_BASE_URL}/studentPerformance/leaderboard/global-full`);
  }

  getGlobalLeaderboardSummary(limit: number = 10): Observable<LeaderboardSummary> {
    return this.http.get<LeaderboardSummary>(`${API_BASE_URL}/studentPerformance/leaderboard/global-summary?limit=${limit}`);
  }
}
