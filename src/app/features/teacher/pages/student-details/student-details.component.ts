import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { PerformanceService, DetailedCoursePerformance } from '../../../../core/services/performance.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-student-details',
  standalone: true,
  imports: [HeaderComponent, CommonModule, DataTableComponent],
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css'],
})
export class StudentDetailsComponent implements OnInit {
  studentId: string = '';
  studentName: string = 'Loading Student...';
  courses: DetailedCoursePerformance[] = [];
  loading: boolean = true;
  error: string | null = null;

  // Columns for tables
  quizColumns: TableColumn[] = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'scoreDisplay', label: 'Score', type: 'text' },
  ];

  assignmentColumns: TableColumn[] = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'scoreDisplay', label: 'Score', type: 'text' },
  ];
  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private performanceService: PerformanceService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.studentId = this.route.snapshot.paramMap.get('id') || '';
    if (this.studentId) {
      this.loadStudentData();
    } else {
      this.error = 'Invalid Student ID';
      this.loading = false;
    }
  }

  loadStudentData() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();
    const teacherId = user?.teacherId || user?.id;

    if (!tenantId || !teacherId) {
      this.error = 'Authorization missing. Try relogging.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.performanceService.getStudentDetailedPerformance(teacherId, this.studentId, tenantId).subscribe({
      next: (data: DetailedCoursePerformance[]) => {
        this.courses = data;
        if (data.length > 0) {
          this.studentName = data[0].studentName;
        } else {
            this.studentName = 'No courses found';
        }
        this.loading = false;
      },
      error: (err: HttpErrorResponse | Error) => {
        console.error('Failed to load student details:', err);
        this.error = 'Failed to load student tracking data.';
        this.loading = false;
      }
    });
  }

  // Navigate back to Track Student page
 goBack() {
  this.router.navigate(['/teacher/trackstudent']); 
}
}
