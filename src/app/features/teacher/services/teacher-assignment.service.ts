// src/app/features/teacher/services/teacher-assignment.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../../core/constants/api.constants';
import {
  Assignment,
  AssignmentCreate,
  AssignmentUpdate,
} from '../../../shared/models/assignment.model';

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

  getTeacherAssignments(tenantId: string, teacherId: string) {
    return this.http.get<Assignment[]>(
      `${ENDPOINTS.TEACHERS.BASE}/teachers/assignments`,
      {
        params: {
          tenantId,
          teacher_id: teacherId,
        },
      },
    );
  }

  getAssignmentById(id: string): Observable<Assignment> {
    return this.http.get<Assignment>(
      `${ENDPOINTS.TEACHERS.BASE}/assignments/${id}`,
    );
  }

  createAssignment(data: AssignmentCreate): Observable<Assignment> {
    return this.http.post<Assignment>(
      `${ENDPOINTS.TEACHERS.BASE}/assignments`,
      data,
    );
  }

  updateAssignment(id: string, data: AssignmentUpdate): Observable<Assignment> {
    return this.http.put<Assignment>(
      `${ENDPOINTS.TEACHERS.BASE}/assignments/${id}`,
      data,
    );
  }

  deleteAssignment(id: string): Observable<void> {
    return this.http.delete<void>(
      `${ENDPOINTS.TEACHERS.BASE}/assignments/${id}`,
    );
  }

  toggleAssignmentStatus(
    id: string,
    status: 'active' | 'completed',
  ): Observable<Assignment> {
    return this.http.patch<Assignment>(
      `${ENDPOINTS.TEACHERS.BASE}/assignments/${id}/status`,
      { status },
    );
  }
}
