import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { AdminService, AdminTeacher, AdminStudent } from '../../../../core/services/admin.service';
import { BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    StatCardComponent,
    DataTableComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // stats
  statsCards: StatCard[] = [
    {
      title: 'Total Students',
      value: '0',
      icon: 'fas fa-users',
      iconBgClass: 'bg-[#23A997]/10',
      iconColorClass: 'text-[#23A997]',
    },
    {
      title: 'Active Courses',
      value: '0',
      icon: 'fas fa-graduation-cap',
      iconBgClass: 'bg-[#23A997]/10',
      iconColorClass: 'text-[#23A997]',
    },
    {
      title: 'Registered Courses',
      value: '0',
      icon: 'fas fa-book-open',
      iconBgClass: 'bg-[#23A997]/10',
      iconColorClass: 'text-[#23A997]',
    },
    {
      title: 'Total Teachers',
      value: '0',
      icon: 'fas fa-chalkboard-teacher',
      iconBgClass: 'bg-[#23A997]/10',
      iconColorClass: 'text-[#23A997]',
    },
  ];

  // teachers
  teacherColumns: TableColumn[] = [
    { key: 'avatar', label: 'Teacher', type: 'avatar', width: '35%' },
    { key: 'assignedCoursesCount', label: 'Courses', type: 'text', width: '25%' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      width: '25%'
    },
    { key: 'action', label: 'Action', type: 'action', width: '15%' }
  ];

  teachers: AdminTeacher[] = [];

  // students
  studentColumns: TableColumn[] = [
    { key: 'avatar', label: 'Student', type: 'avatar', width: '35%' },
    { key: 'country', label: 'Country', type: 'text', width: '25%' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      width: '25%'
    },
    { key: 'action', label: 'Action', type: 'action', width: '15%' }
  ];

  students: AdminStudent[] = [];

  // courses
  courseColumns: TableColumn[] = [
    { key: 'title', label: 'Course Title', type: 'text', width: '35%' },
    { key: 'instructorName', label: 'Instructor', type: 'text', width: '25%' },
    { key: 'status', label: 'Status', type: 'badge', width: '25%' },
    { key: 'action', label: 'Action', type: 'action', width: '15%' }
  ];

  courses: BackendCourse[] = [];
  loading: boolean = true;

  constructor(
    private adminService: AdminService, // UPDATED: Injected AdminService
    private authService: AuthService,      // UPDATED: Injected AuthService
    private router: Router
  ) { }

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        // Only load data if user is actually an admin and has a tenantId
        if (user && (user.role === 'admin' || user.role === 'super_admin') && user.tenantId) {
          this.loadAdminData(user.tenantId);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // UPDATED: Load all required data for admin dashboard
  private allTeachers: AdminTeacher[] = [];

  loadAdminData(tenantId: string) {
    if (tenantId) {
      this.loading = true;

      // Parallel requests for better performance
      this.adminService.getTeachers().subscribe({
        next: (data: AdminTeacher[]) => {
          this.allTeachers = data;
          this.teachers = data.map((t: AdminTeacher) => ({
            ...t,
            avatar: t.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'TR',
            assignedCoursesCount: t.assignedCourses?.length || 0
          })).slice(0, 5);
          this.statsCards[3].value = data.length.toString();
          // Re-map courses if they loaded before teachers
          this.mapCourseInstructors();
        }
      });

      this.adminService.getStudents().subscribe({
        next: (data: AdminStudent[]) => {
          this.students = data.slice(0, 5).map((s: AdminStudent) => ({
            ...s,
            avatar: s.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST'
          }));
          this.statsCards[0].value = data.length.toString();
        }
      });

      this.adminService.getCourses().subscribe({
        next: (data: BackendCourse[]) => {
          this.courses = data.map((c: BackendCourse) => ({
            ...c,
            instructorName: c.instructorName || 'TBD'
          })).slice(0, 5);
          this.statsCards[1].value = data.length.toString();
          this.statsCards[2].value = data.length.toString();
          this.mapCourseInstructors();
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }

  private mapCourseInstructors() {
    if (this.courses.length && this.allTeachers.length) {
      this.courses = this.courses.map(c => {
        if (!c.instructorName && c.teacherId) {
          const teacher = this.allTeachers.find(t => (t._id || t.id) === c.teacherId);
          return { ...c, instructorName: teacher?.fullName || 'N/A' };
        }
        return c;
      });
    }
  }

  navigateToEntity(type: string, row: AdminTeacher | AdminStudent | BackendCourse) {
    const id = row.id || row._id;
    if (!id) return;
    this.router.navigate([`/admin/${type}`], { queryParams: { highlight: id } });
  }

}

interface StatCard {
  title: string;
  value: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
}
