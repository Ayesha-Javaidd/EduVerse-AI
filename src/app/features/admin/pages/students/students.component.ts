import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { AdminService, AdminStudent } from '../../../../core/services/admin.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { FormField } from '../../../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [HeaderComponent, DataTableComponent, CommonModule, FiltersComponent],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {
  currentPage = 1;

  onPageChange(page: number) {
    this.currentPage = page;
  }

  studentColumns: TableColumn[] = [
    { key: 'avatar', label: 'Student', type: 'avatar' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
    },
  ];

  students: AdminStudent[] = [];
  filteredStudents: AdminStudent[] = [];
  loading: boolean = true;
  highlightedRowId: string | null = null;

  // Modal state
  isModalOpen = false;
  isEditMode = false;
  modalTitle = 'Add Student';
  selectedStudent: AdminStudent | null = null;

  studentFields: FormField[] = [
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter full name' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email address' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Enter password (min 6 characters)' },
    { name: 'contactNo', label: 'Contact Number', type: 'phone', placeholder: 'Enter contact number' },
    { name: 'country', label: 'Country', type: 'country', placeholder: 'Select country' },
    {
      name: 'status', label: 'Status', type: 'select', options: [
        { value: 'active', label: 'Active' },
        { value: 'graduated', label: 'Graduated' },
        { value: 'dropped', label: 'Dropped' }
      ]
    },
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private confirmDialogService: ConfirmDialogService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['highlight']) {
        this.highlightedRowId = params['highlight'];
      }
    });
    this.loadStudents();
  }

  loadStudents() {
    this.loading = true;
    this.adminService.getStudents().subscribe({
      next: (data) => {
        this.students = data.map(s => ({
          ...s,
          avatar: s.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST',
          name: s.fullName
        }));
        this.filteredStudents = [...this.students];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading students', err);
        this.loading = false;
      }
    });
  }

  onAddStudent() {
    this.isEditMode = false;
    this.modalTitle = 'Add Student';
    this.selectedStudent = null;
    this.isModalOpen = true;
  }

  onEditStudent(student: AdminStudent) {
    this.isEditMode = true;
    this.modalTitle = 'Edit Student';
    this.selectedStudent = student;
    this.isModalOpen = true;
  }

  async onRemoveStudent(student: AdminStudent) {
    const isConfirmed = await this.confirmDialogService.confirmDelete(student.fullName);
    if (isConfirmed && student.id) {
      this.adminService.deleteStudent(student.id).subscribe({
        next: () => {
          this.loadStudents();
        },
        error: async (err) => {
          await this.confirmDialogService.alert(`Failed to delete student: ${err.error?.detail || 'Unknown error'}`, 'Error', 'danger');
        }
      });
    }
  }

  onModalClose() {
    this.isModalOpen = false;
    this.selectedStudent = null;
  }

  async onModalSubmit(formData: Partial<AdminStudent>) {
    const tenantId = this.authService.getTenantId();
    if (!tenantId) {
      await this.confirmDialogService.alert('Tenant ID not found. Please log in again.', 'Error', 'danger');
      return;
    }

    const studentData: Partial<AdminStudent> = {
      ...formData,
      tenantId,
      role: 'student'
    };

    // Remove immutable fields if editing
    if (this.isEditMode) {
      delete studentData.password;
      delete studentData.role;
      delete studentData.tenantId;
    } else {
      // Default status for new students
      if (!studentData.status) studentData.status = 'active';
    }

    if (this.isEditMode && (!this.selectedStudent || !this.selectedStudent.id)) {
      await this.confirmDialogService.alert('Cannot update: Student ID missing', 'Error', 'danger');
      return;
    }

    const request = this.isEditMode
      ? this.adminService.updateStudent(this.selectedStudent!.id!, studentData)
      : this.adminService.createStudent(studentData);

    request.subscribe({
      next: () => {
        this.onModalClose();
        this.loadStudents();
      },
      error: async (err) => {
        await this.confirmDialogService.alert(`Failed to ${this.isEditMode ? 'update' : 'create'} student: ${err.error?.detail || 'Unknown error'}`, 'Error', 'danger');
      }
    });
  }

  onFiltersChange(filters: { [key: string]: string }) {
    this.currentPage = 1;
    this.filteredStudents = this.students.filter(s => {
      const matchesSearch = !filters['search'] ||
        (s.fullName && s.fullName.toLowerCase().includes(filters['search'].toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(filters['search'].toLowerCase()));

      const matchesStatus = !filters['status'] ||
        (s.status && s.status.toLowerCase() === filters['status'].toLowerCase());

      return matchesSearch && matchesStatus;
    })
  }
}
