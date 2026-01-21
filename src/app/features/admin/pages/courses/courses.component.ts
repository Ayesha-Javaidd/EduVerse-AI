import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../auth/services/auth.service';
import { BackendCourse } from '../../../../core/services/course.service';
import { EntityModalComponent, FormField } from '../../../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [HeaderComponent, DataTableComponent, FiltersComponent, CommonModule, EntityModalComponent],
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
  isEditMode = true; // Admin can only edit, not create
  modalTitle = 'Edit Course';
  selectedCourse: any = null;

  // Admin can only edit status - simplified fields
  courseFields: FormField[] = [
    { name: 'title', label: 'Course Title', type: 'text', required: false, placeholder: 'Course title (read-only)' },
    { name: 'instructorName', label: 'Instructor', type: 'text', required: false, placeholder: 'Instructor name' },
    {
      name: 'status', label: 'Status', type: 'select', options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
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

  onEditCourse(course: BackendCourse) {
    this.isEditMode = true;
    this.modalTitle = 'Edit Course Status';
    this.selectedCourse = {
      ...course,
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
    // Admin can only update status
    const courseData = {
      status: formData.status
    };

    const request = this.adminService.updateCourse(
      (this.selectedCourse as any).id || (this.selectedCourse as any)._id, 
      courseData
    );

    request.subscribe({
      next: () => {
        this.onModalClose();
        this.loadCourses();
      },
      error: (err) => {
        console.error('Update error:', err);
        alert(`Failed to update course status: ${err.error?.detail || JSON.stringify(err.error) || 'Unknown error'}`);
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
