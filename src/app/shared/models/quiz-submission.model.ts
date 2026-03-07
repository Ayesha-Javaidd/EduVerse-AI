/**
 * Quiz Submission Models - TypeScript interfaces matching backend schemas
 * These models mirror the Pydantic schemas in app/schemas/quiz_submissions.py
 */

// ========================
// Answer Item Model
// ========================
/**
 * A single answer provided by the student.
 * Maps to backend AnswerItem schema.
 */
export interface AnswerItem {
  questionIndex: number;  // Index of the question in quiz.questions (0-based)
  selected: string;       // The selected option text
}

// ========================
// Quiz Submission Create Payload
// ========================
/**
 * Payload when a student submits answers (sent to POST /quiz-submissions/).
 * Maps to backend QuizSubmissionCreate schema.
 */
export interface QuizSubmissionCreate {
  studentId: string;              // MongoDB ObjectId of the student
  quizId: string;                 // MongoDB ObjectId of the quiz
  courseId: string;               // MongoDB ObjectId of the course
  tenantId: string;               // MongoDB ObjectId of the tenant
  answers: AnswerItem[];          // List of answers
  percentage?: number;            // Optional (set by grading)
  obtainedMarks?: number;         // Optional (set by grading)
  status?: 'pending' | 'graded';  // Status of submission
}

// ========================
// Quiz Submission Response Model
// ========================
/**
 * Response returned from backend for a submission.
 * Maps to backend QuizSubmissionResponse schema.
 */
export interface QuizSubmission {
  id: string;               // MongoDB ObjectId as string
  studentId: string;
  quizId: string;
  courseId: string;
  tenantId: string;
  submittedAt: string;      // ISO date string
  answers: AnswerItem[];    // What the student submitted
  percentage?: number;      // Calculated percentage (after grading)
  obtainedMarks?: number;   // Marks obtained (after grading)
  status: 'pending' | 'graded' | 'error';
}

// ========================
// Quiz Summary Response (for teachers/dashboard)
// ========================
/**
 * Aggregated quiz summary returned from GET /quiz-submissions/summary/quiz/{id}
 */
export interface QuizSummary {
  quizId: string;
  totalSubmissions: number;
  averagePercentage: number;
  averageMarks: number;
  passRate: number;
  topScores: Array<{
    studentId: string;
    percentage: number;
    obtainedMarks: number;
  }>;
  distribution?: Record<string, number>; // Score distribution buckets
}

// ========================
// Student Analytics Response
// ========================
/**
 * Analytics for a specific student (GET /quiz-submissions/analytics/student/{id})
 */
export interface StudentAnalytics {
  studentId: string;
  totalQuizzesTaken: number;
  averagePercentage: number;
  totalObtainedMarks: number;
  totalPossibleMarks: number;
  recentAttempts: Array<{
    quizId: string;
    percentage: number;
    submittedAt: string;
  }>;
  accuracy: number;
}
