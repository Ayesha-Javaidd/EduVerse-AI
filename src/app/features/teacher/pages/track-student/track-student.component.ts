import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import {
  DataTableComponent,
  TableColumn,
} from '../../../../shared/components/data-table/data-table.component';
import { PerformanceService, StudentPerformance } from '../../../../core/services/performance.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CourseService } from '../../../../core/services/course.service';

interface TeacherTrackedStudentRow {
  studentId: string;
  studentName: string;
  courseCount: number;
  courseSummary: string;
  progress: number;
  grade: string;
}

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

  students: TeacherTrackedStudentRow[] = [];
  allPerformances: StudentPerformance[] = [];
  loading: boolean = true;
  error: string | null = null;

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
    { key: 'courseCount', label: 'Courses', type: 'text' },
    { key: 'courseSummary', label: 'Courses In View', type: 'text' },
    { key: 'progress', label: 'Avg Progress', type: 'progress' },
    { key: 'grade', label: 'Overall Grade', type: 'text' },
    { key: 'action', label: 'Action', type: 'action' },
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
    const teacherId = user?.teacherId || user?.id;

    if (!tenantId || !teacherId) {
      this.error = 'Teacher authorization is missing. Please sign in again.';
      this.loading = false;
      this.allPerformances = [];
      this.students = [];
      this.totalItems = 0;
      return;
    }

    this.loading = true;
    this.error = null;
    this.performanceService.getTeacherPerformances(teacherId, tenantId).subscribe({
      next: (data: StudentPerformance[]) => {
        this.allPerformances = data.map((p: StudentPerformance) => ({
          ...p,
          studentName: p.studentName || 'Student',
          courseName: p.courseName || 'Untitled Course',
        }));
        this.applyFilters();
        this.loading = false;
      },
      error: (err: HttpErrorResponse | Error) => {
        console.error('Error loading teacher performances', err);
        this.error = 'Unable to load tracked students right now.';
        this.loading = false;
      }
    });
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
    const filteredPerformances = this.allPerformances.filter((perf: StudentPerformance) => {
      const matchesSearch = this.filters.search
        ? perf.studentName?.toLowerCase().includes(this.filters.search.toLowerCase())
        : true;

      const matchesCourse = this.filters.course
        ? perf.courseName === this.filters.course
        : true;

      return matchesSearch && matchesCourse;
    });

    const groupedStudents = this.groupPerformancesByStudent(filteredPerformances);
    this.students = groupedStudents.filter((student) =>
      this.filters.status ? student.grade === this.filters.status : true
    );

    this.totalItems = this.students.length;

    const totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    if (this.currentPage > totalPages) {
      this.currentPage = 1;
    }
  }

  // Return color based on progress value
  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-400';
    return 'bg-red-500';
  }

  // Navigate to student details page
  onActionClick(student: TeacherTrackedStudentRow) {
    this.router.navigate(['/teacher/student-details', student.studentId], {
      queryParams: this.filters.course ? { course: this.filters.course } : {},
    });
  }

  private groupPerformancesByStudent(rows: StudentPerformance[]): TeacherTrackedStudentRow[] {
    const grouped = new Map<string, {
      studentId: string;
      studentName: string;
      courseNames: Set<string>;
      progressTotal: number;
      progressCount: number;
      marksTotal: number;
      totalMarks: number;
    }>();

    rows.forEach((row) => {
      const studentId = row.studentId;
      if (!studentId) {
        return;
      }

      const existing = grouped.get(studentId) || {
        studentId,
        studentName: row.studentName || 'Student',
        courseNames: new Set<string>(),
        progressTotal: 0,
        progressCount: 0,
        marksTotal: 0,
        totalMarks: 0,
      };

      existing.studentName = row.studentName || existing.studentName;

      if (row.courseName) {
        existing.courseNames.add(row.courseName);
      }

      if (typeof row.progress === 'number' && !Number.isNaN(row.progress)) {
        existing.progressTotal += row.progress;
        existing.progressCount += 1;
      }

      if (typeof row.marks === 'number' && !Number.isNaN(row.marks)) {
        existing.marksTotal += row.marks;
      }

      if (typeof row.totalMarks === 'number' && !Number.isNaN(row.totalMarks)) {
        existing.totalMarks += row.totalMarks;
      }

      grouped.set(studentId, existing);
    });

    return Array.from(grouped.values())
      .map((student) => {
        const courseNames = Array.from(student.courseNames);
        const averageProgress = student.progressCount
          ? Math.round(student.progressTotal / student.progressCount)
          : 0;

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          courseCount: courseNames.length,
          courseSummary: this.buildCourseSummary(courseNames),
          progress: averageProgress,
          grade: this.calculateGrade(student.marksTotal, student.totalMarks),
        };
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }

  private buildCourseSummary(courseNames: string[]): string {
    if (courseNames.length === 0) {
      return 'No courses';
    }

    if (courseNames.length === 1) {
      return courseNames[0];
    }

    if (courseNames.length === 2) {
      return `${courseNames[0]}, ${courseNames[1]}`;
    }

    return `${courseNames[0]}, ${courseNames[1]} +${courseNames.length - 2} more`;
  }

  private calculateGrade(marks: number, totalMarks: number): string {
    if (totalMarks <= 0) {
      return 'N/A';
    }

    const percentage = (marks / totalMarks) * 100;

    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 61) return 'C+';
    if (percentage >= 58) return 'C';
    if (percentage >= 55) return 'C-';
    if (percentage >= 50) return 'D';
    return 'F';
  }
}
