import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  DataTableComponent,
  TableColumn,
} from '../../../../shared/components/data-table/data-table.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CommonModule } from '@angular/common';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';

@Component({
  selector: 'app-teacher-courses',
  imports: [
    HeaderComponent,
    DataTableComponent,
    CommonModule,
    FiltersComponent,
  ],
  templateUrl: './teacher-courses.component.html',
  styleUrl: './teacher-courses.component.css',
  standalone: true
})
export class TeacherCoursesComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'title', label: 'Course Name', type: 'text' },
    { key: 'courseCode', label: 'Course Code', type: 'text' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'enrolledStudents', label: 'Students', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
  ];

  courses: any[] = []; // UPDATED: Now empty by default
  allCourses: any[] = []; // Store original data for client-side filtering
  loading: boolean = true;

  filterConfig = {
    searchPlaceholder: 'Search courses...',
    dropdowns: [
      {
        key: 'status',
        label: 'Status',
        options: ['Active', 'Inactive', 'Upcoming', 'Completed']
      }
    ]
  };

  constructor(
    private router: Router,               // ADDED: For navigation
    private courseService: CourseService, // UPDATED: Injected CourseService
    private authService: AuthService      // UPDATED: Injected AuthService
  ) { }

  ngOnInit() {
    this.loadTeacherCourses();
  }

  // UPDATED: Fetch courses for this specific teacher
  loadTeacherCourses() {
    const user = this.authService.getCurrentUser();
    const tenantId = this.authService.getTenantId();

    if (user && tenantId) {
      this.loading = true;
      // Use teacherId if available
      const teacherId = user.teacherId || user.id;

      // We pass the teacher_id to the generic getCourses method
      this.courseService.getCourses(tenantId, { teacher_id: teacherId }).subscribe({
        next: (backendCourses) => {
          this.allCourses = backendCourses;
          this.courses = [...this.allCourses];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading teacher courses', err);
          this.loading = false;
        }
      });
    }
  }

  onFiltersChange(filters: { [key: string]: string }) {
    const search = filters['search']?.toLowerCase() || '';
    const status = filters['status'] || '';

    this.courses = this.allCourses.filter(course => {
      const matchesSearch = !search ||
        course.title?.toLowerCase().includes(search) ||
        course.courseCode?.toLowerCase().includes(search);

      const matchesStatus = !status || course.status === status;

      return matchesSearch && matchesStatus;
    });
  }

  onView(course: any): void {

  }
}
