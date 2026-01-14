

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { CourseCardComponent, Course } from '../../components/course-card/course-card.component';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    ButtonComponent,
    StatCardComponent,
    FiltersComponent,
    CourseCardComponent
  ],
  templateUrl: './student-courses.component.html',
  styleUrl: './student-courses.component.css'
})
export class StudentCoursesComponent implements OnInit {

  profile = {
    name: 'Tayyaba Aly',
    initials: 'T'
  };

  // Filter configuration
  filterConfig = {
    searchPlaceholder: 'Search by course name or category...',
    dropdowns: [
      {
        key: 'status',
        label: 'Status',
        options: ['In Progress', 'Completed', 'Not Started']
      }
    ]
  };

  courses: Course[] = []; // UPDATED: Now initialized as empty
  filteredCourses: Course[] = [];
  loading: boolean = true;

  stats = {
    total: 0,
    inProgress: 0,
    completed: 0,
    hours: 0
  };

  constructor(
    private router: Router,
    private courseService: CourseService, // UPDATED: Injected CourseService
    private authService: AuthService      // UPDATED: Injected AuthService
  ) { }

  ngOnInit() {
    this.loadStudentCourses();
  }

  // UPDATED: New method to fetch courses from backend
  loadStudentCourses() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (user && tenantId) {
      this.profile.name = user.fullName || 'Student';
      this.profile.initials = this.profile.name.trim().charAt(0).toUpperCase();

      // Use studentId if available
      const studentId = user.studentId || user.id;

      this.courseService.getStudentCourses(studentId, tenantId).subscribe({
        next: (backendCourses) => {
          // Map backend data to frontend interface
          this.courses = backendCourses.map(bc => this.mapToFrontendCourse(bc));
          this.filteredCourses = [...this.courses];
          this.calculateStats();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading student courses', err);
          this.loading = false;
        }
      });
    } else {
      console.warn('User not logged in or tenant missing');
      this.loading = false;
    }
  }

  // UPDATED: Helper to map backend schema to frontend interface
  private mapToFrontendCourse(bc: BackendCourse): Course {
    return {
      id: bc._id,
      title: bc.title,
      instructor: bc.instructorName || 'Instructor',
      image: bc.thumbnailUrl || 'assets/images/Web Development.jpeg',
      progress: bc.progress || 0,
      duration: bc.duration || '0h',
      lessonsCompleted: bc.lessonsCompleted || 0,
      totalLessons: bc.totalLessons || 0,
      category: bc.category,
      level: (bc.level as any) || 'Beginner',
      rating: 4.5,       // Placeholder
      nextLesson: bc.nextLesson || 'Overview',
      dueDate: 'N/A'
    };
  }

  calculateStats() {
    this.stats.total = this.courses.length;
    this.stats.inProgress = this.courses.filter(c => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100).length;
    this.stats.completed = this.courses.filter(c => c.progress === 100).length;
    this.stats.hours = this.courses.reduce((acc, c) => {
      const match = (c.duration ?? '0h').match(/(\d+)h/);
      const hours = match ? parseFloat(match[1]) : 0;
      return acc + hours;
    }, 0);
  }

  onFiltersChange(filters: { [key: string]: string }) {
    let filtered = [...this.courses];

    const searchQuery = filters['search'] || '';
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
    }

    const status = filters['status'] || '';
    if (status && status !== 'All') {
      switch (status) {
        case 'In Progress':
          filtered = filtered.filter(c => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100);
          break;
        case 'Completed':
          filtered = filtered.filter(c => c.progress === 100);
          break;
        case 'Not Started':
          filtered = filtered.filter(c => c.progress === 0);
          break;
      }
    }

    this.filteredCourses = filtered;
  }

  onCourseClick(course: Course) {

  }

  navigateToExplore() {
    this.router.navigate(['/student/explore-courses']);
  }
}
