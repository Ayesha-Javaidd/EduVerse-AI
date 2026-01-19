export interface AssignmentSubmission {
  id: string;
  studentId: string;
  assignmentId: string;
  courseId: string;
  tenantId: string;
  fileUrl: string;
  submittedAt: string;
  obtainedMarks?: number;
  feedback?: string;
  gradedAt?: string;
}
