/**
 * Course Models - TypeScript interfaces for course-related data
 */

export interface Course {
  courseName: string;
  id: string;
  tenantId: string;
  teacherId: string;
  title: string;
  description?: string;
  category?: string;
  courseCode?: string;
  status: 'active' | 'inactive' | 'archived';
  enrolledStudents?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CourseListParams {
  tenantId: string;          // Required
  teacher_id?: string;
  status?: string;
  category?: string;
  search?: string;
  skip?: number;
  limit?: number;
}
