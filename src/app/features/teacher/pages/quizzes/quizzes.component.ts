import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CreateQuizComponent } from '../../components/create-quiz/create-quiz.component';

// Services
import { QuizService } from '../../services/quiz.service';
import { TeacherProfileService, TeacherProfile } from '../../services/teacher-profile.service';
import { CourseService } from '../../../../shared/services/course.service';

// Models
import { Quiz, QuizCreate, QuizUpdate } from '../../../../shared/models/quiz.model';
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
  imports: [CommonModule, CreateQuizComponent, HeaderComponent],
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.css'],
})
export class QuizzesComponent implements OnInit {
  // ========================
  // Component State
  // ========================
  quizzes: Quiz[] = [];                 // List of quizzes from backend
  courses: Course[] = [];               // Available courses for dropdown
  showModal = false;                    // Controls modal visibility
  selectedQuiz: any = null;             // Quiz being edited (or null for create)
  loading = false;                      // Loading state
  error: string | null = null;          // Error message

  // Teacher context (fetched on init)
  teacherProfile: TeacherProfile | null = null;
  teacherId: string = '';
  tenantId: string = '';

  constructor(
    private quizService: QuizService,
    private teacherProfileService: TeacherProfileService,
    private courseService: CourseService
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
          this.updateQuizStatus(); // Mark past-due quizzes as inactive
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

  // ========================
  // MODAL OPERATIONS
  // ========================

  /**
   * Opens the create/edit modal.
   * @param quiz - If provided, opens in edit mode; otherwise create mode.
   */
  openModal(quiz?: Quiz): void {
    if (quiz) {
      // Transform backend Quiz to modal format
      this.selectedQuiz = this.transformQuizForModal(quiz);
    } else {
      this.selectedQuiz = null;
    }
    this.showModal = true;
  }

  /**
   * Closes the modal and resets selected quiz.
   */
  closeModal(): void {
    this.showModal = false;
    this.selectedQuiz = null;
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
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to create quiz:', err);
        alert(err.error?.detail || 'Failed to create quiz. Please try again.');
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

    this.quizService.updateQuiz(formData.id, this.teacherId, updates).subscribe({
      next: (updatedQuiz) => {
        console.log('Quiz updated successfully:', updatedQuiz);
        // Replace in local array
        const idx = this.quizzes.findIndex((q) => q.id === updatedQuiz.id);
        if (idx > -1) {
          this.quizzes[idx] = updatedQuiz;
        }
        this.updateQuizStatus();
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to update quiz:', err);
        alert(err.error?.detail || 'Failed to update quiz. Please try again.');
      },
    });
  }

  /**
   * Deletes a quiz via API.
   */
  deleteQuiz(quizId: string): void {
    if (!confirm('Are you sure you want to delete this quiz?')) {
      return;
    }

    this.quizService.deleteQuiz(quizId, this.teacherId).subscribe({
      next: () => {
        console.log('Quiz deleted successfully');
        this.quizzes = this.quizzes.filter((q) => q.id !== quizId);
      },
      error: (err) => {
        console.error('Failed to delete quiz:', err);
        alert(err.error?.detail || 'Failed to delete quiz. Please try again.');
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
