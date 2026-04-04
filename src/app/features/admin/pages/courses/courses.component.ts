import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { AdminService, AdminTeacher } from '../../../../core/services/admin.service';
import { AuthService } from '../../../auth/services/auth.service';
import { BackendCourse } from '../../../../core/services/course.service';
import { EntityModalComponent, FormField } from '../../../../shared/components/entity-modal/entity-modal.component';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { CourseCategoriesSettingsComponent } from '../../components/course-categories-settings/course-categories-settings.component';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [HeaderComponent, DataTableComponent, FiltersComponent, CommonModule, EntityModalComponent, CourseCategoriesSettingsComponent],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css',
})
export class CoursesComponent implements OnInit {
  activeTab: 'courses' | 'categories' = 'courses';
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
    },
  ];

  courses: BackendCourse[] = [];
  filteredCourses: BackendCourse[] = [];
  teachers: AdminTeacher[] = [];
  loading: boolean = true;
  highlightedRowId: string | null = null;

  // Modal state
  isModalOpen = false;
  isEditMode = true; // Admin can only edit, not create
  modalTitle = 'Edit Course';
  selectedCourse: BackendCourse | null = null;

  // Admin can only edit status - simplified fields
  courseFields: FormField[] = [
    { name: 'title', label: 'Course Title', type: 'text', required: true, placeholder: 'Course title' },
    { name: 'instructorName', label: 'Instructor', type: 'text', required: false, placeholder: 'Instructor name (read-only)', disabled: true },
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
    // Load teachers first to have data for mapping names
    this.loadTeachers();
  }

  loadTeachers() {
    this.adminService.getTeachers().subscribe({
      next: (teachers: AdminTeacher[]) => {
        this.teachers = teachers;
        const teacherOptions = teachers.map(t => ({
          value: t.id || t._id || '',
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
      next: (data: BackendCourse[]) => {
        this.courses = data.map(c => {
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

  async onDeleteCourse(course: BackendCourse) {
    const isConfirmed = await this.confirmDialogService.confirmDelete(course.title);
    if (isConfirmed) {
      this.adminService.deleteCourse(course.id || course._id!).subscribe({
        next: () => {
          this.loadCourses();
        },
        error: async (err) => {
          await this.confirmDialogService.alert(`Failed to delete course: ${err.error?.detail || 'Unknown error'}`, 'Error', 'danger');
        }
      });
    }
  }

  onModalClose() {
    this.isModalOpen = false;
    this.selectedCourse = null;
  }

  onModalSubmit(formData: Partial<BackendCourse>) {
    // Admin can update title and status
    const courseData = {
      title: formData.title,
      status: formData.status
    };

    const request = this.adminService.updateCourse(
      this.selectedCourse!.id || this.selectedCourse!._id!,
      courseData
    );

    request.subscribe({
      next: () => {
        this.onModalClose();
        this.loadCourses();
      },
      error: async (err) => {
        console.error('Update error:', err);
        await this.confirmDialogService.alert(`Failed to update course status: ${err.error?.detail || JSON.stringify(err.error) || 'Unknown error'}`, 'Error', 'danger');
      }
    });
  }

  onFiltersChange(filters: { [key: string]: string }) {
    this.currentPage = 1;
    this.filteredCourses = this.courses.filter((c: BackendCourse) => {
      const instructorName = c.instructorName || 'TBD';
      const matchesSearch = !filters['search'] ||
        (c.title && c.title.toLowerCase().includes(filters['search'].toLowerCase())) ||
        (instructorName.toLowerCase().includes(filters['search'].toLowerCase())) ||
        (c.courseCode && c.courseCode.toLowerCase().includes(filters['search'].toLowerCase()));

      const matchesStatus = !filters['status'] || c.status === filters['status'];

      return matchesSearch && matchesStatus;
    });
  }
}
