/**
 * Course Builder Models
 * TypeScript interfaces for the Course Builder module
 */

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz';
  duration?: string; // For video: actual duration, for document: provided or auto-calculated
  content: string; // For document: text/file URL; for video: URL; for quiz: quiz ID (required)
  order: number;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
  isExpanded?: boolean; // UI state for accordion
}

// Enrolled student info for management
export interface EnrolledStudent {
  id: string;
  fullName: string;
  email: string;
  enrolledAt: string;
  progress: number; // 0-100
  lessonsCompleted: number;
  lastAccessed?: string;
}

export interface CourseBuilderData {
  id: string;
  title: string;
  description?: string;
  category: string;
  level: string;
  status: 'draft' | 'published'; // Simplified: draft = not visible, published = visible
  isPublic: boolean; // true = in marketplace, false = private (invite only)
  modules: Module[];
  enrolledStudents: number;
  totalLessons: number;
  totalDuration: string; // Calculated from all lessons
  thumbnailUrl?: string;
  teacherId: string;
  tenantId: string;
  courseCode?: string; // Unique course code, auto-generated if not provided
  // Pricing
  isFree: boolean;
  price?: number;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper to generate a course code
export function generateCourseCode(title: string): string {
  // Generate code from title initials + random suffix
  const words = title.trim().split(/\s+/).slice(0, 3);
  const initials = words.map(w => w.charAt(0).toUpperCase()).join('');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${initials || 'CRS'}-${suffix}`;
}

export interface ReorderPayload {
  type: 'module' | 'lesson';
  moduleId?: string; // Required for lesson reorder
  items: { id: string; order: number }[];
}

export interface PublishPayload {
  status: 'draft' | 'published';
}

// Helper function to generate unique IDs
export function generateId(): string {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Helper to calculate total lessons
export function calculateTotalLessons(modules: Module[]): number {
  return modules.reduce((total, module) => total + module.lessons.length, 0);
}

// Helper to calculate total duration from all lessons
// For video lessons: uses the specified duration (MM:SS or HH:MM:SS)
// For document lessons: uses provided duration or estimates based on word count (~200 words/minute)
export function calculateTotalDuration(modules: Module[]): string {
  let totalSeconds = 0;
  
  modules.forEach(module => {
    module.lessons.forEach(lesson => {
      if (lesson.type === 'video' && lesson.duration) {
        // Parse video duration in MM:SS or HH:MM:SS format
        const parts = lesson.duration.split(':').map(Number);
        if (parts.length === 2) {
          totalSeconds += parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      } else if (lesson.type === 'document' && lesson.duration) {
        // If document has explicit duration set by teacher, use it
        const parts = lesson.duration.split(':').map(Number);
        if (parts.length === 2) {
          totalSeconds += parts[0] * 60 + parts[1];
        }
      } else if (lesson.type === 'document' && lesson.content && !lesson.duration) {
        // Estimate reading time: ~200 words per minute average
        const wordCount = lesson.content.trim().split(/\s+/).length;
        const readingMinutes = Math.ceil(wordCount / 200);
        totalSeconds += readingMinutes * 60;
      }
      // Quiz lessons don't contribute to duration
    });
  });
  
  if (totalSeconds === 0) return '0m';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
