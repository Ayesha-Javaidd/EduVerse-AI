import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import {
  DataTableComponent,
  TableColumn,
} from '../../../../shared/components/data-table/data-table.component';
import { StudentEnrollmentChartComponent } from '../../components/student-enrollment-chart/student-enrollment-chart.component';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [
    CommonModule,
    HeaderComponent,
    StatCardComponent,
    DataTableComponent,
    StudentEnrollmentChartComponent,
  ],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.css',
  standalone: true
})
export class TeacherDashboardComponent implements OnInit {
  teacherProfile = {
    name: 'Teacher Name',
    initials: 'TN',
    avatar: '',
  };

  constructor(
    private router: Router,
    private courseService: CourseService, // UPDATED: Injected CourseService
    private authService: AuthService      // UPDATED: Injected AuthService
  ) { }

  quickLinks = [
    {
      title: 'Create Quizzes',
      icon: 'fa fa-edit',
      action: () => this.onGenerateQuiz(),
    },
    {
      title: 'Create Assignment ',
      icon: 'fa-solid fa-file-circle-plus',
      action: () => this.onGenerateAssignment(),
    },
  ];

  onGenerateAssignment() {
    this.router.navigate(['/teacher/assignments']);
  }
  onGenerateQuiz() {
    this.router.navigate(['/teacher/quizzes']);
  }

  statsCards: StatCard[] = [
    {
      title: 'Courses',
      value: '0',
      icon: 'fas fa-book',
      iconBgClass: 'bg-indigo-100',
      iconColorClass: 'text-indigo-600',
    },
    {
      title: 'Students',
      value: '0',
      icon: 'fas fa-users',
      iconBgClass: 'bg-green-100',
      iconColorClass: 'text-green-600',
    },
    {
      title: 'Assignments',
      value: '0',
      icon: 'fas fa-file-alt',
      iconBgClass: 'bg-orange-100',
      iconColorClass: 'text-orange-600',
    },
    {
      title: 'Awaiting Grading',
      value: '0',
      icon: 'fas fa-tasks',
      iconBgClass: 'bg-red-100',
      iconColorClass: 'text-red-600',
    },
  ];

  courseColumns: TableColumn[] = [
    { key: 'title', label: 'Course Name', type: 'text' },
    { key: 'courseCode', label: 'Course ID', type: 'text' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'enrolledStudents', label: 'Enrolled Students', type: 'text' },
  ];

  courses: BackendCourse[] = []; // UPDATED: Properly typed
  loading: boolean = true;

  ngOnInit() {
    this.loadDashboardData();
  }

  // UPDATED: Fetch teacher-specific data with proper types
  loadDashboardData() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (user && tenantId) {
      this.teacherProfile.name = user.fullName || 'Teacher';
      this.teacherProfile.initials = this.teacherProfile.name.trim().charAt(0).toUpperCase();

      // Use teacherId if available
      const teacherId = user.teacherId || user.id;

      this.courseService.getCourses(tenantId, { teacher_id: teacherId }).subscribe({
        next: (data: BackendCourse[]) => {
          this.courses = data;
          this.statsCards[0].value = data.length.toString();

          // Calculate total students across all courses
          const totalStudents = data.reduce((acc: number, c: BackendCourse) => acc + (c.enrolledStudents || 0), 0);
          this.statsCards[1].value = totalStudents.toString();

          this.loading = false;
        },
        error: (err: { message: string }) => {
          console.error('Error loading teacher dashboard data', err);
          this.loading = false;
        }
      });
    }
  }

  onViewCourse(row: any) {

  }

  onViewAllCourses() {
    this.router.navigate(['/teacher/courses']);
  }
}

interface StatCard {
  title: string;
  value: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
}

