import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl.replace(/\/+$/, '');

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/login`,
    STUDENT_LOGIN: `${API_BASE_URL}/students/login`,
    TOKEN: `${API_BASE_URL}/auth/token`,
    STUDENT_SIGNUP: `${API_BASE_URL}/auth/student/signup`,
    TEACHER_SIGNUP: `${API_BASE_URL}/auth/teacher/signup`,
    ADMIN_SIGNUP: `${API_BASE_URL}/auth/admin/signup`,
  },
  COURSES: {
    BASE: `${API_BASE_URL}/courses`,
    METADATA: `${API_BASE_URL}/courses/metadata`,
    METADATA_CATEGORIES: `${API_BASE_URL}/courses/metadata/categories`,
    BY_ID: (id: string) => `${API_BASE_URL}/courses/${id}`,
    STUDENT_COURSES: (studentId: string) =>
      `${API_BASE_URL}/courses/student/${studentId}`,
    ENROLL: `${API_BASE_URL}/courses/enroll`,
    UNENROLL: `${API_BASE_URL}/courses/unenroll`,
    RECOMMENDATIONS: (studentId: string) =>
      `${API_BASE_URL}/courses/recommendations/${studentId}`,
  },
  STUDENTS: {
    BASE: `${API_BASE_URL}/students`,
    ME: `${API_BASE_URL}/students/me`,
    PASSWORD: `${API_BASE_URL}/students/me/password`,
  },
  TEACHERS: {
    BASE: `${API_BASE_URL}/teachers`,
  },
  ADMINS: {
    BASE: `${API_BASE_URL}/admin/dashboard`,
  },
  PAYMENTS: {
    CONFIG: `${API_BASE_URL}/payments/config`,
    CREATE_PAYMENT_INTENT: `${API_BASE_URL}/payments/create-payment-intent`,
  },
  QUIZ_SUBMISSIONS: {
    BASE: `${API_BASE_URL}/quiz-submissions`,
  },
  PERFORMANCE: {
    BASE: `${API_BASE_URL}/studentPerformance`,
  },
  ADAPTIVE: {
    BASE: `${API_BASE_URL}/adaptive`,
    GENERATE_LESSON: `${API_BASE_URL}/adaptive/generate-lesson`,
    GENERATE_BASE_LESSON: `${API_BASE_URL}/adaptive/generate-base-lesson`,
    CLASSIFICATION: (studentId: string) => `${API_BASE_URL}/adaptive/student/${studentId}/classification`,
    GENERATED_LESSONS: (studentId: string) => `${API_BASE_URL}/adaptive/student/${studentId}/generated-lessons`,
    GENERATE_QUIZ: `${API_BASE_URL}/adaptive/generate-quiz`,
  },
  AI_TUTOR: {
    BASE: `${API_BASE_URL}/ai-tutor`,
    CHAT: `${API_BASE_URL}/ai-tutor/chat`,
    SESSION: (courseId: string) => `${API_BASE_URL}/ai-tutor/session/${courseId}`,
  },
} as const;
