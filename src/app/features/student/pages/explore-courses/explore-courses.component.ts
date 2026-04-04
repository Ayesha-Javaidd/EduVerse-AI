
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { CourseCardComponent, Course } from '../../components/course-card/course-card.component';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StudentProgressService, CourseProgress } from '../../services/student-progress.service';
import { forkJoin, map, catchError, of } from 'rxjs';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { CourseMetadataService } from '../../../../shared/services/course-metadata.service';

@Component({
  selector: 'app-explore-courses',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    FiltersComponent,
    CourseCardComponent
  ],
  templateUrl: './explore-courses.component.html',
  styleUrl: './explore-courses.component.css'
})
export class ExploreCoursesComponent implements OnInit {

  profile = {
    name: 'Student',
    initials: 'S'
  };

  // Filter configuration
  filterConfig: {
    searchPlaceholder: string;
    dropdowns: { key: string; label: string; options: string[] }[];
  } = {
    searchPlaceholder: 'Search ',
    dropdowns: [
      {
        key: 'category',
        label: 'Category',
        options: []
      },
      {
        key: 'level',
        label: 'Level',
        options: []
      }
    ]
  };

  availableCourses: Course[] = []; // UPDATED: Initialized as empty
  filteredCourses: Course[] = [];
  loading: boolean = true;

  constructor(
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private progressService: StudentProgressService,
    private confirmDialogService: ConfirmDialogService,
    private courseMetadataService: CourseMetadataService
  ) { }

  ngOnInit() {
    this.loadCourseMetadata();
    this.loadAvailableCourses();
  }

  loadCourseMetadata(forceRefresh = false) {
    this.courseMetadataService.getMetadata(forceRefresh).subscribe({
      next: (metadata) => {
        this.filterConfig = {
          ...this.filterConfig,
          dropdowns: [
            {
              key: 'category',
              label: 'Category',
              options: metadata.categories,
            },
            {
              key: 'level',
              label: 'Level',
              options: metadata.levels,
            },
          ],
        };
      },
      error: (err) => {
        console.error('Failed to load course metadata', err);
      }
    });
  }

  // UPDATED: Fetch all courses for the tenant that are not necessarily the student's enrolled ones
  loadAvailableCourses() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (user) {
      this.profile.name = user.fullName || 'Student';
      this.profile.initials = this.profile.name.trim().charAt(0).toUpperCase();

      const studentId = user.studentId || user.id;
      const isStudent = user.role === 'student';

      // Prepare observables: Fetch all courses globally by passing an empty tenantId
      const courses$ = this.courseService.getCourses('');
      const studentCourses$ = isStudent ? this.courseService.getStudentCourses(studentId, tenantId || '').pipe(catchError(() => of([]))) : of([]);
      const progress$ = isStudent && tenantId ? this.progressService.getAllProgress(tenantId).pipe(catchError(() => of([]))) : of([]);

      forkJoin({
        all: courses$,
        enrolled: studentCourses$,
        progress: progress$
      }).subscribe({
        next: ({ all, enrolled, progress }) => {
          const enrolledMap = new Map((enrolled || []).map(c => [c._id, c]));
          const progressMap = new Map<string, CourseProgress>((progress || []).map(p => [p.courseId, p]));

          this.availableCourses = (all || []).map(bc => {
            const course = this.mapToFrontendCourse(bc);
            const en = enrolledMap.get(bc._id);
            if (en) {
              // Mark as enrolled variant to show progress
              course.variant = 'enrolled';
              course.nextLesson = en.nextLesson;

              const prog = progressMap.get(bc._id);
              if (prog) {
                course.progress = prog.progressPercentage;
                course.lessonsCompleted = prog.completedLessons.length;
              }
            }
            return course;
          });

          this.filteredCourses = [...this.availableCourses];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading courses', err);
          this.loading = false;
        }
      });

    } else {
      this.router.navigate(['/login']);
    }
  }

  private mapToFrontendCourse(bc: BackendCourse): Course {
    return {
      id: bc._id,
      title: bc.title,
      instructor: bc.instructorName || 'Instructor',
      image: bc.thumbnailUrl || 'assets/images/Web Development.jpeg',
      category: bc.category,
      level: (bc.level as any) || 'Intermediate',
      duration: (bc as any).totalDuration || bc.duration || '0m', // Prefer totalDuration from builder
      totalLessons: bc.totalLessons || 0,
      price: bc.isFree ? 0 : (bc.price || 0), // Handle free vs paid
      enrolledStudents: bc.enrolledStudents || 0,
      tenantId: bc.tenantId,
      description: bc.description || ''
    };
  }

  // Handle filter changes
  onFiltersChange(filters: { [key: string]: string }) {
    let filtered = [...this.availableCourses];

    const searchQuery = filters['search'] || '';
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        (c.tenantId && c.tenantId.toLowerCase().includes(query)) ||
        (c.description && c.description.toLowerCase().includes(query))
      );
    }

    const category = filters['category'] || '';
    if (category) {
      filtered = filtered.filter(c => c.category === category);
    }

    const level = filters['level'] || '';
    if (level) {
      filtered = filtered.filter(c => c.level === level);
    }

    this.filteredCourses = filtered;
  }

  onCourseClick(course: Course | null) {
    if (!course) return;
    this.router.navigate(['/student/enroll-course', course.id]);
  }

  async onEnrollClick(course: Course) {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (user) {
      const confirmEnroll = await this.confirmDialogService.confirm('Confirm Enrollment', `Are you sure you want to enroll in "${course.title}"?`);
      if (!confirmEnroll) return;

      const studentId = user.studentId || user.id;

      // Use the course's tenantId for enrollment, not the student's
      const courseTenantId = course.tenantId || tenantId;

      // UPDATED: Now calling real enrollment endpoint with global context
      this.courseService.enrollStudent(course.id, studentId, courseTenantId || '').subscribe({
        next: async (res) => {

          await this.confirmDialogService.alert(`Successfully enrolled in: ${course.title}`, 'Success', 'info');
          this.router.navigate(['/student/courses']);
        },
        error: async (err) => {
          console.error('Enrollment failed', err);
          await this.confirmDialogService.alert(`Enrollment failed: ${err.error?.detail || 'Unknown error'}`, 'Error', 'danger');
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  navigateToMyCourses() {
    this.router.navigate(['/student/courses']);
  }
}
