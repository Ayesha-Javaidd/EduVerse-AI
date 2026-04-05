import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  CourseBuilderData,
  Module,
  EnrolledStudent,
} from '../../../shared/models/course-builder.model';
import { ENDPOINTS } from '../../../core/constants/api.constants';

interface CourseBuilderApiLesson {
  id?: string;
  title?: string;
  type?: 'video' | 'document' | 'quiz';
  duration?: string;
  content?: string;
  order?: number;
}

interface CourseBuilderApiModule {
  id?: string;
  title?: string;
  description?: string;
  order?: number;
  lessons?: CourseBuilderApiLesson[];
}

interface CourseBuilderApiResponse {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  level?: string;
  status?: 'draft' | 'published';
  isPublic?: boolean;
  modules?: CourseBuilderApiModule[];
  enrolledStudents?: number;
  thumbnailUrl?: string;
  teacherId?: string;
  tenantId?: string;
  courseCode?: string;
  isFree?: boolean;
  price?: number;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
  instructorBio?: string;
  hasCertificate?: boolean;
  hasBadges?: boolean;
  hasLifetimeAccess?: boolean;
}

interface EnrolledStudentApiResponse {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  enrolledAt?: string;
  createdAt?: string;
  progress?: number;
  lessonsCompleted?: number;
  lastAccessed?: string;
  lastActive?: string;
}

/**
 * CourseBuilderService
 * Service for Course Builder operations including module/lesson management,
 * drag & drop persistence, and publish/unpublish functionality.
 */
@Injectable({
  providedIn: 'root',
})
export class CourseBuilderService {
  private readonly API_URL = ENDPOINTS.COURSES.BASE;

  constructor(private http: HttpClient) { }

  /**
   * Get course with full module/lesson data for the builder
   */
  getCourseForBuilder(
    courseId: string,
    tenantId: string
  ): Observable<CourseBuilderData> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http
      .get<CourseBuilderApiResponse>(`${this.API_URL}/${courseId}`, { params })
      .pipe(
        map((course) => this.transformCourseResponse(course))
      );
  }

  /**
   * Update course info (title, description, thumbnail, modules)
   */
  updateCourse(
    courseId: string,
    tenantId: string,
    data: Partial<CourseBuilderData>
  ): Observable<CourseBuilderData> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http
      .put<CourseBuilderApiResponse>(`${this.API_URL}/${courseId}`, data, { params })
      .pipe(
        map((course) => this.transformCourseResponse(course))
      );
  }

  /**
   * Persist drag & drop order changes for lessons within a module
   */
  reorderLessons(
    courseId: string,
    tenantId: string,
    moduleId: string,
    lessonIds: string[]
  ): Observable<CourseBuilderData> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http
      .patch<CourseBuilderApiResponse>(
        `${this.API_URL}/${courseId}/reorder/lessons`,
        { moduleId, lessonIds },
        { params }
      )
      .pipe(map((course) => this.transformCourseResponse(course)));
  }

  /**
   * Persist drag & drop order changes for modules within a course
   */
  reorderModules(
    courseId: string,
    tenantId: string,
    moduleIds: string[]
  ): Observable<CourseBuilderData> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http
      .patch<CourseBuilderApiResponse>(
        `${this.API_URL}/${courseId}/reorder/modules`,
        { moduleIds },
        { params }
      )
      .pipe(map((course) => this.transformCourseResponse(course)));
  }

  /**
   * Publish or unpublish a course
   */
  publishCourse(
    courseId: string,
    tenantId: string,
    publish: boolean
  ): Observable<CourseBuilderData> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http
      .post<CourseBuilderApiResponse>(
        `${this.API_URL}/${courseId}/publish`,
        { publish },
        { params }
      )
      .pipe(map((course) => this.transformCourseResponse(course)));
  }

  /**
   * Add a new module to the course
   */
  addModule(
    courseId: string,
    tenantId: string,
    module: Partial<Module>
  ): Observable<CourseBuilderData> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http
      .get<CourseBuilderApiResponse>(`${this.API_URL}/${courseId}`, { params })
      .pipe(
        map((course) => {
          const modules = [...(course.modules || [])];
          modules.push({
            ...module,
            id: module.id || 'mod_' + Date.now(),
            order: modules.length,
            lessons: [],
          });
          return modules;
        }),
        switchMap((modules) =>
          this.http.put<CourseBuilderApiResponse>(
            `${this.API_URL}/${courseId}`,
            { modules },
            { params }
          )
        ),
        map((course) => this.transformCourseResponse(course))
      );
  }

  /**
   * Transform backend course response to CourseBuilderData format
   */
  private transformCourseResponse(course: CourseBuilderApiResponse): CourseBuilderData {
    const modules = (course.modules || []).map(
      (mod, index: number) => ({
        id: mod.id || `mod_${index}_${Date.now()}`,
        title: mod.title || `Module ${index + 1}`,
        description: mod.description || '',
        order: mod.order ?? index,
        lessons: (mod.lessons || []).map(
          (lesson, lessonIndex: number) => ({
            id: lesson.id || `lesson_${index}_${lessonIndex}_${Date.now()}`,
            title: lesson.title || `Lesson ${lessonIndex + 1}`,
            type: lesson.type || 'video',
            duration: lesson.duration || '',
            content: lesson.content || '',
            order: lesson.order ?? lessonIndex,
          })
        ),
        isExpanded: index === 0, // First module expanded by default
      })
    );

    // Calculate total lessons
    const totalLessons = modules.reduce(
      (total: number, mod: Module) => total + mod.lessons.length,
      0
    );

    // Calculate total duration
    let totalSeconds = 0;
    modules.forEach((mod: Module) => {
      mod.lessons.forEach((lesson) => {
        if (lesson.duration) {
          const parts = lesson.duration.split(':').map(Number);
          if (parts.length === 2) {
            totalSeconds += parts[0] * 60 + parts[1];
          } else if (parts.length === 3) {
            totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        }
      });
    });

    let totalDuration = '0m';
    if (totalSeconds > 0) {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      totalDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    return {
      id: course._id || course.id || '',
      title: course.title || '',
      description: course.description || '',
      category: course.category || '',
      level: course.level || '',
      status: course.status || 'draft',
      isPublic: course.isPublic ?? true,
      modules,
      enrolledStudents: course.enrolledStudents || 0,
      totalLessons,
      totalDuration,
      thumbnailUrl: course.thumbnailUrl || '',
      teacherId: course.teacherId || '',
      tenantId: course.tenantId || '',
      courseCode: course.courseCode || '', 
      isFree: course.isFree ?? true,
      price: course.price || 0,
      currency: course.currency || 'USD',
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      // Metadata
      instructorBio: course.instructorBio || '',
      hasCertificate: course.hasCertificate || false,
      hasBadges: course.hasBadges || false,
      hasLifetimeAccess: course.hasLifetimeAccess || false,
    };
  }

  // ========================
  // STUDENT MANAGEMENT
  // ========================

  /**
   * Get list of enrolled students for a course
   */
  getEnrolledStudents(
    courseId: string,
    tenantId: string
  ): Observable<EnrolledStudent[]> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http
      .get<EnrolledStudentApiResponse[]>(`${this.API_URL}/${courseId}/students`, { params })
      .pipe(
        map((students) =>
          students.map((s) => ({
            id: s._id || s.id || '',
            fullName: s.fullName || s.name || 'Unknown',
            email: s.email || '',
            enrolledAt: s.enrolledAt || s.createdAt || new Date().toISOString(),
            progress: s.progress || 0,
            lessonsCompleted: s.lessonsCompleted || 0,
            lastAccessed: s.lastAccessed || s.lastActive,
          }))
        ),
        catchError(() => of([])) // Return empty array if endpoint doesn't exist
      );
  }
}
