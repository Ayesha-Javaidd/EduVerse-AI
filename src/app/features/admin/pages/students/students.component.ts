import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EntityModalComponent, FormField } from '../../../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [HeaderComponent, DataTableComponent, CommonModule, FiltersComponent, ButtonComponent, EntityModalComponent],
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
      badgeColors: {
        Enrolled: 'bg-green-100 text-green-800',
        active: 'bg-green-100 text-green-800',
        Graduated: 'bg-blue-100 text-blue-800',
        Dropped: 'bg-red-100 text-red-800',
        Active: 'bg-green-100 text-green-800',
      },
    },
  ];

  students: any[] = [];
  filteredStudents: any[] = [];
  loading: boolean = true;

  // Modal state
  isModalOpen = false;
  isEditMode = false;
  modalTitle = 'Add Student';
  selectedStudent: any = null;

  studentFields: FormField[] = [
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter full name' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email address' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Enter password (min 6 characters)' },
    { name: 'country', label: 'Country', type: 'text', placeholder: 'Enter country' },
    { name: 'contactNo', label: 'Contact Number', type: 'text', placeholder: 'Enter contact number' },
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
    private authService: AuthService
  ) { }

  ngOnInit() {
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

  onEditStudent(student: any) {
    this.isEditMode = true;
    this.modalTitle = 'Edit Student';
    this.selectedStudent = student;
    this.isModalOpen = true;
  }

  onDeleteStudent(student: any) {
    if (confirm(`Are you sure you want to delete ${student.fullName}?`)) {
      this.adminService.deleteStudent(student.id).subscribe({
        next: () => {
          this.loadStudents();
        },
        error: (err) => {
          alert(`Failed to delete student: ${err.error?.detail || 'Unknown error'}`);
        }
      });
    }
  }

  onModalClose() {
    this.isModalOpen = false;
    this.selectedStudent = null;
  }

  onModalSubmit(formData: any) {
    const tenantId = this.authService.getTenantId();
    if (!tenantId) {
      alert('Tenant ID not found. Please log in again.');
      return;
    }

    const studentData = {
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

    const request = this.isEditMode
      ? this.adminService.updateStudent(this.selectedStudent.id, studentData)
      : this.adminService.createStudent(studentData);

    request.subscribe({
      next: () => {
        this.onModalClose();
        this.loadStudents();
      },
      error: (err) => {
        alert(`Failed to ${this.isEditMode ? 'update' : 'create'} student: ${err.error?.detail || 'Unknown error'}`);
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
