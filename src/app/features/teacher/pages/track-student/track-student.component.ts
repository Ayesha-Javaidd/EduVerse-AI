import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import {
  DataTableComponent,
  TableColumn,
} from '../../../../shared/components/data-table/data-table.component';
import { PerformanceService, StudentPerformance } from '../../../../core/services/performance.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CourseService } from '../../../../core/services/course.service';

@Component({
  selector: 'app-track-student',
  standalone: true,
  imports: [HeaderComponent, CommonModule, FiltersComponent, DataTableComponent],
  templateUrl: './track-student.component.html',
  styleUrls: ['./track-student.component.css'],
})
export class TrackStudentComponent implements OnInit {
  // Filter state
  filters: { search: string; course: string; status: string } = { search: '', course: '', status: '' };

  // UPDATED: Properly typed
  students: StudentPerformance[] = [];
  allPerformances: StudentPerformance[] = [];
  loading: boolean = true;

  // Pagination state - ADDED back for template compatibility
  pageSize: number = 10;
  currentPage: number = 1;
  totalItems: number = 0;

  // Dropdown filters configuration
  dropdowns = [
    {
      key: 'course',
      label: 'Courses',
      options: [] as string[], // Initialize as empty, will be populated dynamically
    },
    {
      key: 'status',
      label: 'Grade',
      options: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
    },
  ];

  // Table columns
  columns: TableColumn[] = [
    { key: 'studentName', label: 'Student Name', type: 'text' },
    { key: 'courseName', label: 'Course Enrolled', type: 'text' },
    { key: 'progress', label: 'Progress', type: 'progress' },
    { key: 'grade', label: 'Grades', type: 'text' },
    { key: 'action', label: 'Action', type: 'link', link: '/teacher/student-details' },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private performanceService: PerformanceService,
    private authService: AuthService,
    private courseService: CourseService
  ) { }

  ngOnInit() {
    this.loadTeacherCourses(); // Fetch courses for the filter dropdown
    this.route.queryParams.subscribe(params => {
      if (params['course']) {
        this.filters.course = params['course'];
      }
      this.loadPerformances();
    });
  }

  loadTeacherCourses() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();
    const teacherId = user?.teacherId || user?.id;

    if (tenantId && teacherId) {
      this.courseService.getCourses(tenantId, { teacher_id: teacherId }).subscribe({
        next: (courses) => {
          const courseNames = courses.map(c => c.title);
          const courseDropdown = this.dropdowns.find(d => d.key === 'course');
          if (courseDropdown) {
            courseDropdown.options = courseNames;
          }
        },
        error: (err) => console.error('Error loading teacher courses for filter', err)
      });
    }
  }

  // UPDATED: Load real performance data with proper types
  loadPerformances() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();
    const teacherId = user?.teacherId;

    if (tenantId && teacherId) {
      this.loading = true;
      this.performanceService.getTeacherPerformances(teacherId, tenantId).subscribe({
        next: (data: StudentPerformance[]) => {
          this.allPerformances = data.map((p: StudentPerformance) => ({
            ...p,
            studentName: p.studentName || 'Student Name',
            courseName: p.courseName || 'Course Name'
          }));
          this.totalItems = this.allPerformances.length;
          this.applyFilters();
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error loading teacher performances', err);
          this.loading = false;
        }
      });
    } else if (tenantId) {
      // Fallback for admin or if teacherId is missing (should not happen for teacher role)
      this.loading = true;
      this.performanceService.getTenantPerformances(tenantId).subscribe({
        next: (data: StudentPerformance[]) => {
          this.allPerformances = data;
          this.totalItems = this.allPerformances.length;
          this.applyFilters();
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error loading tenant performances', err);
          this.loading = false;
        }
      });
    }
  }

  // Handle filter changes - UPDATED: Changed signature to match FiltersComponent output
  onFiltersChange(updatedFilters: { [key: string]: string }) {
    this.filters = {
      search: updatedFilters['search'] || '',
      course: updatedFilters['course'] || '',
      status: updatedFilters['status'] || ''
    };
    this.currentPage = 1; // Reset to first page on filter change
    this.applyFilters();
  }

  // Apply filters to student list
  applyFilters() {
    this.students = this.allPerformances.filter((perf: StudentPerformance) => {
      const matchesSearch = this.filters.search
        ? perf.studentName?.toLowerCase().includes(this.filters.search.toLowerCase())
        : true;

      const matchesCourse = this.filters.course
        ? perf.courseName === this.filters.course
        : true;

      const matchesGrade = this.filters.status
        ? perf.grade === this.filters.status
        : true;

      return matchesSearch && matchesCourse && matchesGrade;
    });
  }

  // Return color based on progress value
  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-400';
    return 'bg-red-500';
  }

  // Navigate to student details page
  onActionClick(student: StudentPerformance) {
    this.router.navigate(['/teacher/student-details', student.studentId]);
  }
}
