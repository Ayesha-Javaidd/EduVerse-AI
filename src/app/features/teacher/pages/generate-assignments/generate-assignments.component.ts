import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Models
import {
  Assignment,
  AssignmentCreate,
  AssignmentUpdate,
} from '../../../../shared/models/assignment.model';
import { Course } from '../../../../shared/models/course.model';

// Services
import { TeacherAssignmentService } from '../../services/teacher-assignment.service';
import { CourseService } from '../../../../shared/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';

// Components
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { AssignmentModalComponent } from '../../components/assignment-modal/assignment-modal.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AssignmentCardComponent } from '../../components/assignment-card/assignment-card.component';

@Component({
  selector: 'app-generate-assignments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    StatCardComponent,
    EmptyStateComponent,
    AssignmentModalComponent,
    HeaderComponent,
    AssignmentCardComponent,
  ],
  templateUrl: './generate-assignments.component.html',
  styleUrls: ['./generate-assignments.component.css'],
})
export class GenerateAssignmentsComponent implements OnInit {
  assignments: Assignment[] = [];
  filteredAssignments: Assignment[] = [];
  courses: Course[] = [];

  showCreateModal = false;
  formData: Partial<Assignment> = {};
  editingAssignmentId: string | null = null;

  selectedCourseFilter: string | null = null;
  activeTab: 'active' | 'completed' = 'active';

  totalAssignmentsCount = 0;
  totalSubmissionsCount = 0;
  totalStudentsCount = 0;

  teacherId: string = '';
  tenantId: string = '';

  constructor(
    private assignmentService: TeacherAssignmentService,
    private courseService: CourseService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadTeacherContext();
  }

  // ----------------------
  // Teacher & Courses
  // ----------------------
  loadTeacherContext(): void {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (!user || !tenantId) {
      console.error('Teacher profile or tenantId not found');
      return;
    }

    this.teacherId = user.id;
    this.tenantId = tenantId;

    this.loadCourses();
    this.refreshAssignments();
  }

  loadCourses(): void {
    if (!this.tenantId || !this.teacherId) return;

    this.courseService
      .getCourses({ tenantId: this.tenantId, teacher_id: this.teacherId })
      .subscribe({
        next: (courses: Course[]) => {
          this.courses = courses;
          console.log('Courses loaded:', courses);
        },
        error: (err) => console.error('Failed to load courses:', err),
      });
  }

  // ----------------------
  // Modal Operations
  // ----------------------
  openCreateModal(assignment?: Assignment): void {
    this.showCreateModal = true;

    if (assignment) {
      this.editingAssignmentId = assignment.id ?? null;
      this.formData = { ...assignment };
    } else {
      this.editingAssignmentId = null;
      this.formData = {};
    }
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.editingAssignmentId = null;
    this.formData = {};
  }

  handleSubmit(data: AssignmentCreate | AssignmentUpdate): void {
    const processedData = {
      ...data,
      totalMarks:
        typeof data.totalMarks === 'string'
          ? +data.totalMarks
          : data.totalMarks,
      passingMarks:
        typeof data.passingMarks === 'string'
          ? +data.passingMarks
          : data.passingMarks,
    };

    if (this.editingAssignmentId) {
      this.assignmentService
        .updateAssignment(this.editingAssignmentId, processedData)
        .subscribe(() => {
          this.refreshAssignments();
          this.closeCreateModal();
        });
    } else {
      this.assignmentService
        .createAssignment(processedData as AssignmentCreate)
        .subscribe(() => {
          this.refreshAssignments();
          this.closeCreateModal();
        });
    }
  }

  // ----------------------
  // Assignment Operations
  // ----------------------
  refreshAssignments(): void {
    this.assignmentService.getAllAssignments().subscribe((assignments) => {
      this.assignments = assignments;
      this.totalAssignmentsCount = assignments.length;
      this.totalSubmissionsCount = assignments.reduce(
        (sum, a) => sum + (a.submitted ?? 0),
        0,
      );
      this.totalStudentsCount = assignments.reduce(
        (sum, a) => sum + (a.totalStudents ?? 0),
        0,
      );
      this.applyFilters();
    });
  }

  applyFilters(): void {
    this.filteredAssignments = this.assignments.filter((a) => {
      return (
        (!this.selectedCourseFilter ||
          a.courseId === this.selectedCourseFilter) &&
        (this.activeTab === 'active'
          ? a.status === 'active'
          : a.status === 'completed')
      );
    });
  }

  editAssignment(assignment: Assignment): void {
    this.openCreateModal(assignment);
  }

  deleteAssignment(assignment: Assignment): void {
    if (!assignment.id) return;
    this.assignmentService.deleteAssignment(assignment.id).subscribe(() => {
      this.assignments = this.assignments.filter((a) => a.id !== assignment.id);
      this.applyFilters();
    });
  }

  toggleAssignmentStatus(assignment: Assignment): void {
    const newStatus: 'active' | 'completed' =
      assignment.status === 'active' ? 'completed' : 'active';
    if (assignment.id) {
      this.assignmentService
        .toggleAssignmentStatus(assignment.id, newStatus)
        .subscribe((updated) => {
          assignment.status = updated.status;
        });
    }
  }

  viewAssignment(assignment: Assignment): void {
    console.log('View assignment clicked:', assignment);
  }

  // ----------------------
  // Derived counts
  // ----------------------
  get activeCount(): number {
    return this.assignments.filter((a) => a.status === 'active').length;
  }

  get completedCount(): number {
    return this.assignments.filter((a) => a.status === 'completed').length;
  }
}
