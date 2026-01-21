export interface AssignmentSubmission {
  id: string;

  studentId: string;
  assignmentId: string;
  courseId: string;
  tenantId: string;

  fileUrl: string;
  submittedAt: string;

  obtainedMarks?: number | null;
  feedback?: string | null;
  gradedAt?: string | null;
}

export interface AssignmentSubmissionCreatePayload {
  assignmentId: string;
  courseId: string;
  fileUrl: string;
}

export interface AssignmentSubmissionGradePayload {
  obtainedMarks?: number;
  feedback?: string;
}
