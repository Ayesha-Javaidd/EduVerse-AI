import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../../core/constants/api.constants';

export interface Assignment {
  id?: number;
  title: string;
  description: string;
  course: string;
  dueDate: string;
  dueTime: string;
  totalMarks: number;
  passingMarks: number;
  allowLateSubmission: boolean;
  status?: 'active' | 'completed';
  submitted?: number;
  totalStudents?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TeacherAssignmentService {
  constructor(private http: HttpClient) {}

  getAllAssignments(): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(
      `${ENDPOINTS.TEACHERS.BASE}/assignments`,
    );
  }

  getAssignmentById(id: number): Observable<Assignment> {
    return this.http.get<Assignment>(
      `${ENDPOINTS.TEACHERS.BASE}/assignments/${id}`,
    );
  }

  createAssignment(data: Assignment): Observable<Assignment> {
    return this.http.post<Assignment>(
      `${ENDPOINTS.TEACHERS.BASE}/assignments`,
      data,
    );
  }

  updateAssignment(id: number, data: Assignment): Observable<Assignment> {
    return this.http.put<Assignment>(
      `${ENDPOINTS.TEACHERS.BASE}/assignments/${id}`,
      data,
    );
  }

  deleteAssignment(id: number): Observable<void> {
    return this.http.delete<void>(
      `${ENDPOINTS.TEACHERS.BASE}/assignments/${id}`,
    );
  }

  toggleAssignmentStatus(
    id: number,
    status: 'active' | 'completed',
  ): Observable<Assignment> {
    return this.http.patch<Assignment>(
      `${ENDPOINTS.TEACHERS.BASE}/assignments/${id}/status`,
      { status },
    );
  }
}
