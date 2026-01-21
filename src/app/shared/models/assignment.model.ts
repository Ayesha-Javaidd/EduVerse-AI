/* ================================
   Assignment Core Models
================================ */
export type AssignmentStatus = 'active' | 'submitted' | 'graded' | 'inactive';

export interface Assignment {
  submitted: boolean;
  id: string;

  courseId: string;
  courseName: string;
  teacherId: string;
  tenantId: string;

  title: string;
  description?: string;

  dueDate: string; // ISO datetime
  dueTime?: string; // ISO datetime | null

  totalMarks: number;
  passingMarks: number;

  status: AssignmentStatus;

  fileUrl?: string;
  allowedFormats: string[];

  uploadedAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/* ================================
   Create & Update Payloads
================================ */

export interface AssignmentCreatePayload {
  courseId: string; // required
  title: string; // required
  description?: string; // optional

  dueDate: string; // required (ISO string)
  dueTime?: string | null; // optional, can be null

  totalMarks?: number; // optional
  passingMarks?: number; // optional

  status?: AssignmentStatus; // optional, default "active"
  fileUrl?: string | null; // optional
  allowedFormats?: string[]; // optional
  allowLateSubmission?: boolean; // optional, default false
  attachments?: string[]; // optional, default []
}

export interface AssignmentUpdatePayload {
  title?: string;
  description?: string;

  dueDate?: string | null;
  dueTime?: string | null;

  totalMarks?: number;
  passingMarks?: number;

  status?: AssignmentStatus;
  fileUrl?: string | null;
  allowedFormats?: string[] | null;
}
