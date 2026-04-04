import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TableColumn, DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CommonModule } from '@angular/common';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AdminService, AdminTeacher } from '../../../../core/services/admin.service';
import { AuthService } from '../../../auth/services/auth.service';
import { EntityModalComponent, FormField } from '../../../../shared/components/entity-modal/entity-modal.component';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [HeaderComponent, DataTableComponent, CommonModule, FiltersComponent, ButtonComponent, EntityModalComponent],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.css'
})
export class TeachersComponent implements OnInit {
  currentPage = 1;

  onPageChange(page: number) {
    this.currentPage = page;
  }

  teacherColumns: TableColumn[] = [
    { key: 'avatar', label: 'Teacher', type: 'avatar' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'assignedCoursesCount', label: 'Courses', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
    },
  ];

  teachers: AdminTeacher[] = [];
  filteredTeachers: AdminTeacher[] = [];
  loading: boolean = true;
  highlightedRowId: string | null = null;

  // Modal state
  isModalOpen = false;
  isEditMode = false;
  modalTitle = 'Add Teacher';
  selectedTeacher: AdminTeacher | null = null;

  teacherFields: FormField[] = [
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter full name' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email address' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Enter password (min 6 characters)' },
    { name: 'contactNo', label: 'Contact Number', type: 'phone', placeholder: 'Enter contact number' },
    { name: 'country', label: 'Country', type: 'country', placeholder: 'Select country' },
    {
      name: 'status', label: 'Status', type: 'select', options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    { name: 'qualifications', label: 'Qualifications', type: 'array', placeholder: 'e.g., PhD in Computer Science' },
    { name: 'subjects', label: 'Subjects', type: 'array', placeholder: 'e.g., Mathematics, Physics' },

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
    this.loadTeachers();
  }

  loadTeachers() {
    this.loading = true;
    this.adminService.getTeachers().subscribe({
      next: (data) => {
        this.teachers = data.map(t => ({
          ...t,
          avatar: t.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'TR',
          assignedCoursesCount: t.assignedCourses?.length || 0,
          name: t.fullName
        }));
        this.filteredTeachers = [...this.teachers];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading teachers', err);
        this.loading = false;
      }
    });
  }

  onAddTeacher() {
    this.isEditMode = false;
    this.modalTitle = 'Add Teacher';
    this.selectedTeacher = null;

    // Reset fields for add mode
    this.teacherFields = this.teacherFields.map(field => {
      if (field.name === 'email') return { ...field, disabled: false };
      if (field.name === 'status') return { ...field, disabled: false };
      if (field.name === 'password') return { ...field, required: true };
      return field;
    });

    this.isModalOpen = true;
  }

  onEditTeacher(teacher: AdminTeacher) {
    this.isEditMode = true;
    this.modalTitle = 'Edit Teacher';
    this.selectedTeacher = teacher;

    // Change fields for edit mode
    this.teacherFields = this.teacherFields.map(field => {
      if (field.name === 'email') return { ...field, disabled: true };
      if (field.name === 'status') return { ...field, disabled: false };
      if (field.name === 'password') return { ...field, required: false };
      return field;
    });

    this.isModalOpen = true;
  }

  async onDeleteTeacher(teacher: AdminTeacher) {
    const isConfirmed = await this.confirmDialogService.confirmDelete(teacher.fullName);
    if (isConfirmed && teacher.id) {
      this.adminService.deleteTeacher(teacher.id).subscribe({
        next: () => {
          this.loadTeachers();
        },
        error: async (err) => {
          await this.confirmDialogService.alert(`Failed to delete teacher: ${err.error?.detail || 'Unknown error'}`, 'Error', 'danger');
        }
      });
    }
  }

  onModalClose() {
    this.isModalOpen = false;
    this.selectedTeacher = null;
  }

  async onModalSubmit(formData: Partial<AdminTeacher>) {
    const tenantId = this.authService.getTenantId();
    if (!tenantId) {
      await this.confirmDialogService.alert('Tenant ID not found. Please log in again.', 'Error', 'danger');
      return;
    }

    const teacherData: Partial<AdminTeacher> = {
      ...formData,
      tenantId,
      role: 'teacher'
    };

    // Only set default for new teachers if not provided
    if (!this.isEditMode) {
      teacherData.assignedCourses = [];
      if (!teacherData.status) teacherData.status = 'active';
    }

    // Remove password and immutable fields if editing
    if (this.isEditMode) {
      delete teacherData.password;
      delete teacherData.role;
      delete teacherData.tenantId;
    }

    if (this.isEditMode && (!this.selectedTeacher || !this.selectedTeacher.id)) {
      await this.confirmDialogService.alert('Cannot update: Teacher ID missing', 'Error', 'danger');
      return;
    }

    const request = this.isEditMode
      ? this.adminService.updateTeacher(this.selectedTeacher!.id!, teacherData)
      : this.adminService.createTeacher(teacherData);

    request.subscribe({
      next: () => {
        this.onModalClose();
        this.loadTeachers();
      },
      error: async (err) => {
        await this.confirmDialogService.alert(`Failed to ${this.isEditMode ? 'update' : 'create'} teacher: ${err.error?.detail || 'Unknown error'}`, 'Error', 'danger');
      }
    });
  }

  onFiltersChange(filters: { [key: string]: string }) {
    this.currentPage = 1;
    this.filteredTeachers = this.teachers.filter(t => {
      const matchesSearch = !filters['search'] ||
        (t.fullName && t.fullName.toLowerCase().includes(filters['search'].toLowerCase())) ||
        (t.email && t.email.toLowerCase().includes(filters['search'].toLowerCase()));

      const matchesStatus = !filters['status'] ||
        (t.status && t.status.toLowerCase() === filters['status'].toLowerCase());

      return matchesSearch && matchesStatus;
    })
  }
}
