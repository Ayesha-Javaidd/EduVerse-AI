// src/app/shared/models/assignment.model.ts
export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName?: string;
  teacherId: string;
  tenantId: string;
  dueDate: string;
  totalMarks: number;
  passingMarks: number;
  allowLateSubmission: boolean;
  status?: 'active' | 'completed';
  submitted?: number;
  totalStudents?: number;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentCreate {
  title: string;
  description: string;
  courseId: string;
  teacherId: string;
  tenantId: string;
  dueDate: string;
  totalMarks: number;
  passingMarks: number;
  allowLateSubmission: boolean;
  attachments?: File[] | string[];
}

export interface AssignmentUpdate {
  title?: string;
  description?: string;
  courseId?: string;
  dueDate?: string;
  totalMarks?: number;
  passingMarks?: number;
  allowLateSubmission?: boolean;
  attachments?: File[] | string[];
}
