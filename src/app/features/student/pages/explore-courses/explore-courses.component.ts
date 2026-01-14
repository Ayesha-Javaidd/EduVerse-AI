
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { CourseCardComponent, Course } from '../../components/course-card/course-card.component';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';

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
  filterConfig = {
    searchPlaceholder: 'Search ',
    dropdowns: [
      {
        key: 'category',
        label: 'Category',
        options: ['Web Development', 'Design', 'Data Science', 'Mobile Dev', 'Marketing', 'Cloud']
      },
      {
        key: 'level',
        label: 'Level',
        options: ['Beginner', 'Intermediate', 'Advanced']
      }
    ]
  };

  availableCourses: Course[] = []; // UPDATED: Initialized as empty
  filteredCourses: Course[] = [];
  loading: boolean = true;

  constructor(
    private router: Router,
    private courseService: CourseService, // UPDATED: Injected CourseService
    private authService: AuthService      // UPDATED: Injected AuthService
  ) { }

  ngOnInit() {
    this.loadAvailableCourses();
  }

  // UPDATED: Fetch all courses for the tenant that are not necessarily the student's enrolled ones
  loadAvailableCourses() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (tenantId) {
      if (user) {
        this.profile.name = user.fullName || 'Student';
        this.profile.initials = this.profile.name.trim().charAt(0).toUpperCase();
      }

      // Fetch all courses for this tenant
      this.courseService.getCourses(tenantId).subscribe({
        next: (backendCourses) => {
          this.availableCourses = backendCourses.map(bc => this.mapToFrontendCourse(bc));
          this.filteredCourses = [...this.availableCourses];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading available courses', err);
          this.loading = false;
        }
      });
    } else {
      console.warn('Tenant ID missing');
      this.loading = false;
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
      rating: 4.5,
      duration: bc.duration || '0h',
      totalLessons: bc.totalLessons || 0,
      price: 0,
      enrolledStudents: bc.enrolledStudents || 0,
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

  }

  onEnrollClick(course: Course) {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (user && tenantId) {
      const confirmEnroll = confirm(`Are you sure you want to enroll in "${course.title}"?`);
      if (!confirmEnroll) return;

      // Ensure we use the student-specific ID (studentId) if available
      const studentId = user.studentId || user.id;

      // UPDATED: Now calling real enrollment endpoint
      this.courseService.enrollStudent(course.id, studentId, tenantId).subscribe({
        next: (res) => {

          alert(`Successfully enrolled in: ${course.title}`);
          this.router.navigate(['/student/courses']);
        },
        error: (err) => {
          console.error('Enrollment failed', err);
          alert(`Enrollment failed: ${err.error?.detail || 'Unknown error'}`);
        }
      });
    } else {
      alert('You must be logged in to enroll in a course.');
      this.router.navigate(['/login']);
    }
  }

  navigateToMyCourses() {
    this.router.navigate(['/student/courses']);
  }
}
