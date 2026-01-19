export const API_BASE_URL = 'http://localhost:8000';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/login`,
    STUDENT_LOGIN: `${API_BASE_URL}/students/login`,
  },
  COURSES: {
    BASE: `${API_BASE_URL}/courses`,
    BY_ID: (id: string) => `${API_BASE_URL}/courses/${id}`,
    STUDENT_COURSES: (studentId: string) =>
      `${API_BASE_URL}/courses/student/${studentId}`,
    ENROLL: `${API_BASE_URL}/courses/enroll`,
    UNENROLL: `${API_BASE_URL}/courses/unenroll`,
  },
  STUDENTS: {
    BASE: `${API_BASE_URL}/students`,
  },
  TEACHERS: {
    BASE: `${API_BASE_URL}/teachers`,
  },
  ADMINS: {
    BASE: `${API_BASE_URL}/admin/dashboard`,
  },
  PERFORMANCE: {
    BASE: `${API_BASE_URL}/studentPerformance`,
  },
  ASSIGNMENT_SUBMISSIONS: {
    BASE: `${API_BASE_URL}/assignment-submissions`,
    BY_STUDENT: `${API_BASE_URL}/assignment-submissions/me`,
    BY_ASSIGNMENT: (assignmentId: string) =>
      `${API_BASE_URL}/assignment-submissions/assignment/${assignmentId}`,
    SUBMISSION: (submissionId: string) =>
      `${API_BASE_URL}/assignment-submissions/${submissionId}`,
  },
};
