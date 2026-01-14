import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../auth/services/auth.service';
import { BackendCourse } from '../../../../core/services/course.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EntityModalComponent, FormField } from '../../../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [HeaderComponent, DataTableComponent, FiltersComponent, CommonModule, ButtonComponent, EntityModalComponent],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css',
})
export class CoursesComponent implements OnInit {
  currentPage = 1;

  onPageChange(page: number) {
    this.currentPage = page;
  }

  courseColumns: TableColumn[] = [
    { key: 'title', label: 'Course Title', type: 'text' },
    { key: 'courseCode', label: 'Code', type: 'text' },
    { key: 'instructorName', label: 'Instructor', type: 'text' },
    { key: 'enrolledStudents', label: 'Enrollment', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeColors: {
        Active: 'bg-green-100 text-green-800',
        active: 'bg-green-100 text-green-800',
        Inactive: 'bg-red-100 text-red-800',
        inactive: 'bg-red-100 text-red-800',
        Upcoming: 'bg-blue-100 text-blue-800',
        upcoming: 'bg-blue-100 text-blue-800',
        Completed: 'bg-gray-100 text-gray-800',
        completed: 'bg-gray-100 text-gray-800',
      },
    },
  ];

  courses: BackendCourse[] = [];
  filteredCourses: BackendCourse[] = [];
  teachers: any[] = [];
  loading: boolean = true;

  // Modal state
  isModalOpen = false;
  isEditMode = false;
  modalTitle = 'Add Course';
  selectedCourse: any = null;

  courseFields: FormField[] = [
    { name: 'title', label: 'Course Title', type: 'text', required: true, placeholder: 'Enter course title' },
    { name: 'courseCode', label: 'Course Code', type: 'text', required: true, placeholder: 'e.g., CS101' },
    { name: 'category', label: 'Category', type: 'text', required: true, placeholder: 'e.g., Computer Science' },
    {
      name: 'level', label: 'Level', type: 'select', options: [
        { value: 'Beginner', label: 'Beginner' },
        { value: 'Intermediate', label: 'Intermediate' },
        { value: 'Advanced', label: 'Advanced' }
      ]
    },
    { name: 'teacherId', label: 'Instructor', type: 'select', required: true, options: [] },
    { name: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g., 10 weeks' },
    { name: 'thumbnailUrl', label: 'Thumbnail URL', type: 'text', placeholder: 'https://example.com/image.jpg' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter course description' },
    { name: 'modules', label: 'Modules', type: 'array', placeholder: 'e.g., Week 1: Introduction' },
    {
      name: 'status', label: 'Status', type: 'select', options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'completed', label: 'Completed' }
      ]
    },
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Load teachers first to have data for mapping names
    this.loadTeachers();
  }

  loadTeachers() {
    this.adminService.getTeachers().subscribe({
      next: (teachers: any[]) => {
        this.teachers = teachers;
        const teacherOptions = teachers.map(t => ({
          value: t.id || t._id,
          label: t.fullName
        }));

        const teacherField = this.courseFields.find(f => f.name === 'teacherId');
        if (teacherField) {
          teacherField.options = teacherOptions;
        }

        // Load courses after teachers are loaded to map names correctly
        this.loadCourses();
      },
      error: (err) => {
        console.error('Error loading teachers for dropdown', err);
        // Load courses even if teachers fail, though names will be TBD
        this.loadCourses();
      }
    });
  }

  loadCourses() {
    this.loading = true;
    this.adminService.getCourses().subscribe({
      next: (data: any[]) => {
        this.courses = data.map((c: any) => {
          // Try to find teacher name if missing
          const teacher = this.teachers.find(t => (t.id || t._id) === c.teacherId);
          return {
            ...c,
            instructorName: c.instructorName || teacher?.fullName || 'TBD'
          };
        });
        this.filteredCourses = [...this.courses];
        this.loading = false;
      },
      error: (err: { message: string }) => {
        console.error('Error loading courses', err);
        this.loading = false;
      }
    });
  }

  onAddCourse() {
    if (this.teachers.length === 0) {
      alert('Please add at least one teacher before creating a course.');
      return;
    }
    this.isEditMode = false;
    this.modalTitle = 'Add Course';
    this.selectedCourse = null;
    this.isModalOpen = true;
  }

  onEditCourse(course: BackendCourse) {
    this.isEditMode = true;
    this.modalTitle = 'Edit Course';
    // Deep copy and transform modules if necessary
    this.selectedCourse = {
      ...course,
      modules: (course.modules || []).map((m: any) => typeof m === 'object' ? m.title : m)
    };
    this.isModalOpen = true;
  }

  onDeleteCourse(course: BackendCourse) {
    if (confirm(`Are you sure you want to delete ${course.title}?`)) {
      this.adminService.deleteCourse((course as any).id || (course as any)._id).subscribe({
        next: () => {
          this.loadCourses();
        },
        error: (err) => {
          alert(`Failed to delete course: ${err.error?.detail || 'Unknown error'}`);
        }
      });
    }
  }

  onModalClose() {
    this.isModalOpen = false;
    this.selectedCourse = null;
  }

  onModalSubmit(formData: any) {
    const tenantId = this.authService.getTenantId();
    if (!tenantId) {
      alert('Tenant ID not found. Please log in again.');
      return;
    }

    const courseData = {
      ...formData,
      tenantId,
      // Ensure status is lowercase for backend consistency
      status: formData.status ? formData.status.charAt(0).toUpperCase() + formData.status.slice(1).toLowerCase() : 'Active'
    };

    // Remove immutable fields if editing
    if (this.isEditMode) {
      delete courseData.tenantId;
    }

    // Transform modules array of strings to array of objects
    if (courseData.modules && Array.isArray(courseData.modules)) {
      courseData.modules = courseData.modules.map((title: string) => ({ title }));
    }

    const request = this.isEditMode
      ? this.adminService.updateCourse((this.selectedCourse as any).id || (this.selectedCourse as any)._id, courseData)
      : this.adminService.createCourse(courseData);

    request.subscribe({
      next: () => {
        this.onModalClose();
        this.loadCourses();
      },
      error: (err) => {
        console.error('Update/Create validation error:', err);
        alert(`Failed to ${this.isEditMode ? 'update' : 'create'} course: ${err.error?.detail || JSON.stringify(err.error) || 'Unknown error'}`);
      }
    });
  }

  onFiltersChange(filters: { [key: string]: string }) {
    this.currentPage = 1;
    this.filteredCourses = this.courses.filter((c: BackendCourse) => {
      const instructorName = (c as any).instructorName || 'TBD';
      const matchesSearch = !filters['search'] ||
        (c.title && c.title.toLowerCase().includes(filters['search'].toLowerCase())) ||
        (instructorName.toLowerCase().includes(filters['search'].toLowerCase())) ||
        (c.courseCode && c.courseCode.toLowerCase().includes(filters['search'].toLowerCase()));

      const matchesStatus = !filters['status'] || c.status === filters['status'];

      return matchesSearch && matchesStatus;
    });
  }
}
