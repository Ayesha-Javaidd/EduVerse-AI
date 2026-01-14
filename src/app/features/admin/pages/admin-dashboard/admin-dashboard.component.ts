import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { AdminService, AdminTeacher, AdminStudent } from '../../../../core/services/admin.service';
import { AuthService } from '../../../auth/services/auth.service';

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
      iconBgClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
    },
    {
      title: 'Active Courses',
      value: '0',
      icon: 'fas fa-graduation-cap',
      iconBgClass: 'bg-green-100',
      iconColorClass: 'text-green-600',
    },
    {
      title: 'Registered Courses',
      value: '0',
      icon: 'fas fa-book-open',
      iconBgClass: 'bg-purple-100',
      iconColorClass: 'text-purple-600',
    },
    {
      title: 'Total Teachers',
      value: '0',
      icon: 'fas fa-chalkboard-teacher',
      iconBgClass: 'bg-orange-100',
      iconColorClass: 'text-orange-600',
    },
  ];

  // teachers
  teacherColumns: TableColumn[] = [
    { key: 'avatar', label: 'Teacher', type: 'avatar' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'fullName', label: 'Full Name', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeColors: {
        Active: 'bg-green-100 text-green-800',
        Inactive: 'bg-red-100 text-red-800',
      },
    },
  ];

  teachers: any[] = [];

  // students
  studentColumns: TableColumn[] = [
    { key: 'avatar', label: 'Student', type: 'avatar' },
    { key: 'fullName', label: 'Full Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeColors: {
        Enrolled: 'bg-green-100 text-green-800',
        Graduated: 'bg-blue-100 text-blue-800',
        Dropped: 'bg-red-100 text-red-800',
        Active: 'bg-green-100 text-green-800',
      },
    },
  ];

  students: any[] = [];

  // courses
  courseColumns: TableColumn[] = [
    { key: 'title', label: 'Course Title', type: 'text' },
    { key: 'courseCode', label: 'Code', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
  ];

  courses: any[] = [];
  loading: boolean = true;

  constructor(
    private adminService: AdminService, // UPDATED: Injected AdminService
    private authService: AuthService      // UPDATED: Injected AuthService
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
  loadAdminData(tenantId: string) {
    if (tenantId) {
      this.loading = true;

      // Parallel requests for better performance
      this.adminService.getTeachers().subscribe({
        next: (data: AdminTeacher[]) => {
          this.teachers = data.slice(0, 5).map((t: AdminTeacher) => ({
            ...t,
            avatar: t.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'TR'
          }));
          this.statsCards[3].value = data.length.toString();
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
        next: (data: any[]) => {
          this.courses = data.slice(0, 5);
          this.statsCards[1].value = data.length.toString();
          this.statsCards[2].value = data.length.toString();
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }
}

interface StatCard {
  title: string;
  value: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
}
