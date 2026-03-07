import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CreateQuizComponent } from '../../components/create-quiz/create-quiz.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';

// Services
import { QuizService } from '../../services/quiz.service';
import {
  TeacherProfileService,
  TeacherProfile,
} from '../../services/teacher-profile.service';
import { CourseService } from '../../../../shared/services/course.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

// Models
import {
  Quiz,
  QuizCreate,
  QuizUpdate,
} from '../../../../shared/models/quiz.model';
import { Course } from '../../../../shared/models/course.model';

/**
 * QuizzesComponent (Teacher)
 * --------------------------
 * Main page for teachers to view, create, edit, and delete quizzes.
 * Connected to backend via QuizService.
 *
 * Flow:
 * 1. On init, fetch teacher profile to get teacherId and tenantId
 * 2. Fetch courses for dropdown in create/edit modal
 * 3. Fetch quizzes filtered by teacherId
 * 4. Create/Update/Delete operations call backend API
 */
@Component({
  selector: 'app-quizzes',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateQuizComponent, HeaderComponent, FiltersComponent],
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.css'],
})
export class QuizzesComponent implements OnInit {
  // Reference to the create quiz modal component
  @ViewChild(CreateQuizComponent) createQuizModal!: CreateQuizComponent;

  // ========================
  // Component State
  // ========================
  quizzes: Quiz[] = []; // List of quizzes from backend
  filteredQuizzes: Quiz[] = []; // Filtered list for display
  courses: Course[] = []; // Available courses for dropdown
  showModal = false; // Controls modal visibility
  selectedQuiz: any = null; // Quiz being edited (or null for create)
  loading = false; // Loading state
  error: string | null = null; // Error message

  // Filter configuration
  filterDropdowns: { key: string; label: string; options: string[] }[] = [];
  searchText = '';
  selectedCourseFilter = '';
  selectedStatusFilter = '';
  selectedSubmissionFilter = '';

  // Track which quizzes have submissions (for filtering)
  quizSubmissionStatus: Map<string, boolean> = new Map();

  // Teacher context (fetched on init)
  teacherProfile: TeacherProfile | null = null;
  teacherId: string = '';
  tenantId: string = '';

  constructor(
    private quizService: QuizService,
    private teacherProfileService: TeacherProfileService,
    private courseService: CourseService,
    private toastService: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadTeacherContext();
  }

  // ========================
  // INITIALIZATION
  // ========================

  /**
   * Step 1: Load teacher profile to get teacherId and tenantId.
   * Then load courses and quizzes.
   */
  loadTeacherContext(): void {
    this.loading = true;
    this.error = null;

    this.teacherProfileService.getMyProfile().subscribe({
      next: (profile) => {
        this.teacherProfile = profile;
        this.teacherId = profile.id;
        this.tenantId = profile.tenantId || '';

        // Now load courses and quizzes
        this.loadCourses();
        this.loadQuizzes();
      },
      error: (err) => {
        console.error('Failed to load teacher profile:', err);
        this.error = 'Failed to load teacher profile. Please try again.';
        this.loading = false;
      },
    });
  }

  /**
   * Step 2: Load courses for the dropdown.
   * Filters by tenantId and teacher_id.
   */
  loadCourses(): void {
    if (!this.tenantId) {
      console.warn('No tenantId available for loading courses');
      return;
    }

    this.courseService
      .getCourses({
        tenantId: this.tenantId,
        teacher_id: this.teacherId,
      })
      .subscribe({
        next: (courses) => {
          this.courses = courses;
          console.log('Courses loaded:', courses.length);
          // Update filter dropdown options with course names, status, and submission status
          this.filterDropdowns = [
            {
              key: 'course',
              label: 'Course',
              options: courses.map((c) => c.title),
            },
            {
              key: 'status',
              label: 'Status',
              options: ['Active', 'Inactive'],
            },
            {
              key: 'submissions',
              label: 'Submissions',
              options: ['Has Submissions', 'No Submissions', 'Due Passed'],
            },
          ];
        },
        error: (err) => {
          console.error('Failed to load courses:', err);
          // Non-blocking error - quizzes can still work
        },
      });
  }

  /**
   * Step 3: Load quizzes for this teacher.
   */
  loadQuizzes(): void {
    this.loading = true;

    this.quizService
      .getQuizzes({
        tenant_id: this.tenantId,
        teacher_id: this.teacherId,
        sort: '-createdAt', // Most recent first
      })
      .subscribe({
        next: (quizzes) => {
          this.quizzes = quizzes;
          this.filteredQuizzes = quizzes; // Initialize filtered list
          this.updateQuizStatus(); // Mark past-due quizzes as inactive
          this.loadSubmissionStatus(quizzes); // Load submission status for filtering
          this.loading = false;
          console.log('Quizzes loaded:', quizzes.length);
        },
        error: (err) => {
          console.error('Failed to load quizzes:', err);
          this.error = 'Failed to load quizzes. Please try again.';
          this.loading = false;
        },
      });
  }

  /**
   * Load submission status for all quizzes (for filtering purposes)
   */
  loadSubmissionStatus(quizzes: Quiz[]): void {
    quizzes.forEach((quiz) => {
      this.quizService.checkQuizSubmissions(quiz.id).subscribe({
        next: (response) => {
          this.quizSubmissionStatus.set(quiz.id, response.hasSubmissions);
        },
        error: () => {
          this.quizSubmissionStatus.set(quiz.id, false);
        },
      });
    });
  }

  // ========================
  // MODAL OPERATIONS
  // ========================

  // Track if selected quiz has submissions (questions cannot be edited)
  hasSubmissions = false;

  /**
   * Opens the create/edit modal.
   * @param quiz - If provided, opens in edit mode; otherwise create mode.
   */
  openModal(quiz?: Quiz): void {
    if (quiz) {
      // Check if quiz has submissions before opening edit modal
      this.quizService.checkQuizSubmissions(quiz.id).subscribe({
        next: (response) => {
          this.hasSubmissions = response.hasSubmissions;
          if (response.hasSubmissions) {
            console.log('Quiz has submissions - questions locked for editing');
          }
          // Transform backend Quiz to modal format
          this.selectedQuiz = this.transformQuizForModal(quiz);
          this.showModal = true;
        },
        error: (err) => {
          console.error('Failed to check quiz submissions:', err);
          // Open modal anyway but assume no submissions
          this.hasSubmissions = false;
          this.selectedQuiz = this.transformQuizForModal(quiz);
          this.showModal = true;
        },
      });
    } else {
      this.hasSubmissions = false;
      this.selectedQuiz = null;
      this.showModal = true;
    }
  }

  /**
   * Closes the modal and resets selected quiz.
   */
  closeModal(): void {
    this.showModal = false;
    this.selectedQuiz = null;
    this.hasSubmissions = false;
    // Reset the saving state in the modal component
    if (this.createQuizModal) {
      this.createQuizModal.resetSaving();
    }
  }

  /**
   * Handle filter changes from FiltersComponent.
   */
  onFiltersChange(filters: { [key: string]: string }): void {
    this.searchText = filters['search'] || '';
    this.selectedCourseFilter = filters['course'] || '';
    this.selectedStatusFilter = filters['status'] || '';
    this.selectedSubmissionFilter = filters['submissions'] || '';
    this.applyFilters();
  }

  /**
   * Apply search and course filters to quizzes.
   */
  applyFilters(): void {
    let result = [...this.quizzes];

    // Filter by course name
    if (this.selectedCourseFilter) {
      result = result.filter(
        (q) => q.courseName === this.selectedCourseFilter
      );
    }

    // Filter by status (active/inactive)
    if (this.selectedStatusFilter) {
      const statusLower = this.selectedStatusFilter.toLowerCase();
      result = result.filter((q) => q.status === statusLower);
    }

    // Filter by submission status
    if (this.selectedSubmissionFilter) {
      const today = new Date();
      if (this.selectedSubmissionFilter === 'Has Submissions') {
        result = result.filter((q) => this.quizSubmissionStatus.get(q.id) === true);
      } else if (this.selectedSubmissionFilter === 'No Submissions') {
        result = result.filter((q) => this.quizSubmissionStatus.get(q.id) === false && new Date(q.dueDate) >= today);
      } else if (this.selectedSubmissionFilter === 'Due Passed') {
        result = result.filter((q) => new Date(q.dueDate) < today);
      }
    }

    // Filter by search text (quiz number or description)
    if (this.searchText) {
      const searchLower = this.searchText.toLowerCase();
      result = result.filter(
        (q) =>
          q.quizNumber.toString().includes(searchLower) ||
          (q.description && q.description.toLowerCase().includes(searchLower)) ||
          q.courseName.toLowerCase().includes(searchLower)
      );
    }

    this.filteredQuizzes = result;
  }

  // ========================
  // CRUD OPERATIONS
  // ========================

  /**
   * Handles save event from CreateQuizComponent.
   * Creates new quiz or updates existing one.
   */
  addOrUpdateQuiz(formData: any): void {
    if (formData.id) {
      // UPDATE existing quiz
      this.updateQuiz(formData);
    } else {
      // CREATE new quiz
      this.createQuiz(formData);
    }
  }

  /**
   * Creates a new quiz via API.
   */
  createQuiz(formData: any): void {
    // Validate courseId is present
    if (!formData.courseId) {
      alert('Please select a course.');
      return;
    }

    // Find the selected course to get the title
    const selectedCourse = this.courses.find((c) => c.id === formData.courseId);

    // Build payload for backend
    const payload: QuizCreate = {
      courseId: formData.courseId,
      courseName: selectedCourse?.title || formData.course || '',
      teacherId: this.teacherId,
      tenantId: this.tenantId,
      quizNumber: parseInt(formData.quizNo, 10) || 1,
      description: formData.description || '',
      dueDate: new Date(formData.dueDate).toISOString(),
      questions: this.transformQuestionsForBackend(formData.questions),
      totalMarks: formData.questions.length, // 1 mark per question
      aiGenerated: false,
    };

    console.log('Creating quiz with payload:', payload);

    this.quizService.createQuiz(payload).subscribe({
      next: (createdQuiz) => {
        console.log('Quiz created successfully:', createdQuiz);
        this.quizzes.unshift(createdQuiz); // Add to top of list
        this.applyFilters(); // Re-apply filters to update display
        this.closeModal();
        this.toastService.success('Quiz created successfully!');
      },
      error: (err) => {
        console.error('Failed to create quiz:', err);
        this.toastService.error(err.error?.detail || 'Failed to create quiz. Please try again.');
        // Reset saving state so user can try again
        if (this.createQuizModal) {
          this.createQuizModal.resetSaving();
        }
      },
    });
  }

  /**
   * Updates an existing quiz via API.
   */
  updateQuiz(formData: any): void {
    const updates: QuizUpdate = {
      quizNumber: parseInt(formData.quizNo, 10),
      description: formData.description,
      dueDate: new Date(formData.dueDate).toISOString(),
      questions: this.transformQuestionsForBackend(formData.questions),
      totalMarks: formData.questions.length,
    };

    console.log('Updating quiz:', formData.id, updates);

    this.quizService
      .updateQuiz(formData.id, this.teacherId, updates)
      .subscribe({
        next: (updatedQuiz) => {
          console.log('Quiz updated successfully:', updatedQuiz);
          // Replace in local array
          const idx = this.quizzes.findIndex((q) => q.id === updatedQuiz.id);
          if (idx > -1) {
            this.quizzes[idx] = updatedQuiz;
          }
          this.updateQuizStatus();
          this.applyFilters(); // Re-apply filters to update display
          this.closeModal();
          this.toastService.success('Quiz updated successfully!');
        },
        error: (err) => {
          console.error('Failed to update quiz:', err);
          this.toastService.error(
            err.error?.detail || 'Failed to update quiz. Please try again.',
          );
          // Reset saving state so user can try again
          if (this.createQuizModal) {
            this.createQuizModal.resetSaving();
          }
        },
      });
  }

  /**
   * Deletes a quiz via API.
   */
  async deleteQuiz(quizId: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirmDelete('this quiz');
    if (!confirmed) {
      return;
    }

    this.quizService.deleteQuiz(quizId, this.teacherId).subscribe({
      next: () => {
        console.log('Quiz deleted successfully');
        this.quizzes = this.quizzes.filter((q) => q.id !== quizId);
        this.applyFilters(); // Re-apply filters to update display
        this.toastService.success('Quiz deleted successfully!');
      },
      error: (err) => {
        console.error('Failed to delete quiz:', err);
        this.toastService.error(err.error?.detail || 'Failed to delete quiz. Please try again.');
      },
    });
  }

  // ========================
  // HELPER METHODS
  // ========================

  /**
   * Transforms backend Quiz to format expected by modal component.
   */
  transformQuizForModal(quiz: Quiz): any {
    return {
      id: quiz.id,
      quizNo: quiz.quizNumber.toString().padStart(2, '0'),
      course: quiz.courseName,
      courseId: quiz.courseId,
      dueDate: new Date(quiz.dueDate),
      description: quiz.description || '',
      questions: quiz.questions.map((q) => ({
        statement: q.question,
        options: q.options,
        correctAnswer: q.answer,
      })),
      status: quiz.status === 'active' ? 'Active' : 'Inactive',
    };
  }

  /**
   * Transforms modal question format to backend QuizQuestion format.
   */
  transformQuestionsForBackend(questions: any[]): any[] {
    return questions.map((q) => ({
      question: q.statement,
      options: q.options,
      answer: q.correctAnswer,
    }));
  }

  /**
   * Updates quiz status based on due date (client-side helper).
   */
  updateQuizStatus(): void {
    const today = new Date();
    this.quizzes.forEach((q) => {
      if (new Date(q.dueDate) < today && q.status === 'active') {
        // Note: This is just for display. Backend manages actual status.
        q.status = 'inactive';
      }
    });
  }

  /**
   * Returns formatted quiz number for display.
   */
  getQuizDisplayNumber(quiz: Quiz): string {
    return quiz.quizNumber.toString().padStart(2, '0');
  }
}
