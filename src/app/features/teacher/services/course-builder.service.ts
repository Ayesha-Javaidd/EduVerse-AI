import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  CourseBuilderData,
  Module,
  EnrolledStudent,
  ReorderPayload,
  PublishPayload,
} from '../../../shared/models/course-builder.model';

/**
 * CourseBuilderService
 * Service for Course Builder operations including module/lesson management,
 * drag & drop persistence, and publish/unpublish functionality.
 */
@Injectable({
  providedIn: 'root',
})
export class CourseBuilderService {
  private readonly API_URL = 'http://localhost:8000/courses';

  constructor(private http: HttpClient) {}

  /**
   * Get course with full module/lesson data for the builder
   */
  getCourseForBuilder(
    courseId: string,
    tenantId: string
  ): Observable<CourseBuilderData> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http
      .get<any>(`${this.API_URL}/${courseId}`, { params })
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
      .put<any>(`${this.API_URL}/${courseId}`, data, { params })
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
      .patch<any>(
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
      .patch<any>(
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
      .post<any>(
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
    // This will use the updateCourse method with the new modules array
    // The actual implementation will be handled by getting current course,
    // adding the module, and calling updateCourse
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http
      .get<any>(`${this.API_URL}/${courseId}`, { params })
      .pipe(
        map((course) => {
          const modules = course.modules || [];
          modules.push({
            ...module,
            id: module.id || 'mod_' + Date.now(),
            order: modules.length,
            lessons: [],
          });
          return modules;
        }),
        // Chain to update
        map((modules) => {
          this.http
            .put<any>(`${this.API_URL}/${courseId}`, { modules }, { params })
            .subscribe();
          return modules;
        })
      ) as any;
  }

  /**
   * Transform backend course response to CourseBuilderData format
   */
  private transformCourseResponse(course: any): CourseBuilderData {
    const modules = (course.modules || []).map(
      (mod: any, index: number) => ({
        id: mod.id || `mod_${index}_${Date.now()}`,
        title: mod.title || `Module ${index + 1}`,
        description: mod.description || '',
        order: mod.order ?? index,
        lessons: (mod.lessons || []).map(
          (lesson: any, lessonIndex: number) => ({
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
      id: course._id || course.id,
      title: course.title || '',
      description: course.description || '',
      category: course.category || 'General',
      level: course.level || 'Beginner',
      status: course.status || 'draft',
      isPublic: course.isPublic ?? true,
      modules,
      enrolledStudents: course.enrolledStudents || 0,
      totalLessons,
      totalDuration,
      thumbnailUrl: course.thumbnailUrl || '',
      teacherId: course.teacherId || '',
      tenantId: course.tenantId || '',
      isFree: course.isFree ?? true,
      price: course.price || 0,
      currency: course.currency || 'USD',
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
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
      .get<any[]>(`${this.API_URL}/${courseId}/students`, { params })
      .pipe(
        map((students) =>
          students.map((s) => ({
            id: s._id || s.id,
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

  /**
   * Unenroll a student from the course
   */
  unenrollStudent(
    courseId: string,
    tenantId: string,
    studentId: string
  ): Observable<void> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http.delete<void>(
      `${this.API_URL}/${courseId}/students/${studentId}`,
      { params }
    );
  }
}
