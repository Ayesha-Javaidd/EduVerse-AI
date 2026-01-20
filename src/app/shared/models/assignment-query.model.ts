/* ================================
   Query / Pagination Models
================================ */

import { Assignment } from './assignment.model';

export interface AssignmentQueryParams {
  search?: string;
  courseId?: string;
  teacherId?: string;
  tenantId?: string;
  status?: 'active' | 'graded' | 'submitted';

  fromDate?: string; // ISO datetime
  toDate?: string; // ISO datetime

  sortBy?: 'uploadedAt' | 'dueDate' | 'title';
  order?: 1 | -1;

  page?: number;
  limit?: number;
}

/* ================================
   Paginated Response
================================ */

export interface PaginatedAssignmentsResponse {
  data: Assignment[];
  total: number;
  page: number;
  limit: number;
  results: Assignment[];
}
