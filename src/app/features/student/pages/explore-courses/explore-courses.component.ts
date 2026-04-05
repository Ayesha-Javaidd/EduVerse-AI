
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { CourseCardComponent, Course } from '../../components/course-card/course-card.component';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { forkJoin, catchError, of } from 'rxjs';
import { CourseMetadataService } from '../../../../shared/services/course-metadata.service';

@Component({
  selector: 'app-explore-courses',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    StatCardComponent,
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
  stats = {
    total: 0,
    free: 0,
    beginner: 0,
    categories: 0
  };

  constructor(
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
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

    if (user) {
      this.profile.name = user.fullName || 'Student';
      this.profile.initials = this.profile.name.trim().charAt(0).toUpperCase();

      const studentId = user.studentId || user.id;
      const courses$ = this.courseService.getCourses();
      const studentCourses$ = this.courseService.getStudentCourses(studentId).pipe(catchError(() => of([])));

      forkJoin({
        all: courses$,
        enrolled: studentCourses$
      }).subscribe({
        next: ({ all, enrolled }) => {
          const enrolledIds = new Set((enrolled || []).map(c => c._id));

          this.availableCourses = (all || [])
            .filter((course) => !enrolledIds.has(course._id))
            .map((course) => ({
              ...this.mapToFrontendCourse(course),
              variant: 'explore' as const
            }));

          this.filteredCourses = [...this.availableCourses];
          this.calculateStats();
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

  private calculateStats() {
    const uniqueCategories = new Set(this.availableCourses.map((course) => course.category));

    this.stats.total = this.availableCourses.length;
    this.stats.free = this.availableCourses.filter((course) => (course.price || 0) === 0).length;
    this.stats.beginner = this.availableCourses.filter((course) => course.level === 'Beginner').length;
    this.stats.categories = uniqueCategories.size;
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
        (c.instructor && c.instructor.toLowerCase().includes(query)) ||
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

  onEnrollClick(course: Course) {
    this.onCourseClick(course);
  }

  navigateToMyCourses() {
    this.router.navigate(['/student/courses']);
  }
}
