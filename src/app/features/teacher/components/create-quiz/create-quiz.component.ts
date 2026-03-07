import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  AbstractControl,
} from '@angular/forms';

// Import Course model
import { Course } from '../../../../shared/models/course.model';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-quiz.component.html',
  styleUrls: ['./create-quiz.component.css'],
})
export class CreateQuizComponent implements OnInit {
  @Input() quiz: any = null;                    // Quiz data for edit mode
  @Input() courses: Course[] = [];              // Courses from parent (fetched from API)
  @Input() hasSubmissions = false;              // Whether students have submitted answers
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  quizForm!: FormGroup;
  isEditMode = false;
  isDisabled = false;
  questionsLocked = false;                      // True if questions cannot be edited (submissions exist)
  isSaving = false;                             // Prevents double-click on save button
  originalFormValue: any = null;                // Store original form value for change detection

  // Option letters for display and selection
  optionLetters = ['a', 'b', 'c', 'd'];

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this.quiz) {
      this.isEditMode = true;
      this.questionsLocked = this.hasSubmissions; // Lock questions if submissions exist
      this.populateFormWithQuizData(this.quiz);
      
      // Disable locked fields after populating data
      if (this.questionsLocked) {
        this.disableLockedFields();
      }
    }
  }

  /**
   * Disable fields that should be locked when submissions exist.
   * Only description, due date, quiz number, and status can be edited.
   */
  disableLockedFields(): void {
    this.quizForm.get('courseId')?.disable();
    // Quiz number is now editable even with submissions
    // Questions are handled via questionsLocked flag in template
    const questionsArray = this.quizForm.get('questions') as FormArray;
    questionsArray.controls.forEach((questionGroup) => {
      questionGroup.get('statement')?.disable();
      questionGroup.get('correctAnswer')?.disable();
      const optionsArray = questionGroup.get('options') as FormArray;
      optionsArray.controls.forEach((option) => option.disable());
    });
  }

  initForm(): void {
    this.quizForm = this.fb.group({
      id: [null],
      quizNo: ['', Validators.required],
      course: [''],                            // Will store course title (optional for display)
      courseId: ['', Validators.required],     // Will store course ID (required)
      dueDate: ['', Validators.required],
      description: [''],
      questions: this.fb.array([this.createQuestionGroup()]),
      status: ['Active'],
    });
  }

  createQuestionGroup(): FormGroup {
    return this.fb.group({
      statement: ['', Validators.required],
      options: this.fb.array([
        this.fb.control('', Validators.required),
        this.fb.control('', Validators.required),
      ]),
      correctAnswer: ['', Validators.required], // Stores option letter: 'a', 'b', 'c', or 'd'
    });
  }

  get questions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  getOptions(i: number): FormArray {
    return this.questions.at(i).get('options') as FormArray;
  }

  /**
   * Get the letter for a given option index (0 -> 'a', 1 -> 'b', etc.)
   */
  getOptionLetter(index: number): string {
    return this.optionLetters[index] || '';
  }

  /**
   * Add an option to a question (max 4 options)
   */
  addOption(questionIndex: number): void {
    const options = this.getOptions(questionIndex);
    if (options.length < 4) {
      options.push(this.fb.control('', Validators.required));
    }
  }

  /**
   * Remove an option from a question (min 2 options required)
   */
  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getOptions(questionIndex);
    if (options.length > 2) {
      options.removeAt(optionIndex);
      // Reset correct answer if the removed option was selected
      const correctAnswer = this.questions.at(questionIndex).get('correctAnswer');
      const currentAnswerIndex = this.optionLetters.indexOf(correctAnswer?.value);
      if (currentAnswerIndex >= options.length) {
        correctAnswer?.setValue('');
      }
    }
  }

  /**
   * Get available option letters for correct answer dropdown
   */
  getAvailableOptions(questionIndex: number): string[] {
    const optionsCount = this.getOptions(questionIndex).length;
    return this.optionLetters.slice(0, optionsCount);
  }

  addQuestion(): void {
    this.questions.push(this.createQuestionGroup());
  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
  }

  /**
   * Called when course selection changes.
   * Updates both course name and courseId in form.
   */
  onCourseChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const courseId = select.value;
    const selectedCourse = this.courses.find(c => c.id === courseId);

    if (selectedCourse) {
      this.quizForm.patchValue({
        course: selectedCourse.title,
        courseId: selectedCourse.id,
      });
    }
  }

  populateFormWithQuizData(quizData: any): void {
    this.quizForm.patchValue({
      id: quizData.id,
      quizNo: quizData.quizNo,
      course: quizData.course,
      courseId: quizData.courseId || '',
      dueDate: this.formatDate(quizData.dueDate),
      description: quizData.description,
      status: quizData.status,
    });

    const qArray = this.quizForm.get('questions') as FormArray;
    qArray.clear();

    quizData.questions.forEach((q: any) => {
      // Convert correct answer (actual text) to option letter
      const answerIndex = q.options.findIndex((opt: string) => opt === q.correctAnswer);
      const answerLetter = answerIndex >= 0 ? this.optionLetters[answerIndex] : '';

      qArray.push(
        this.fb.group({
          statement: [q.statement, Validators.required],
          options: this.fb.array(
            q.options.map((opt: string) => this.fb.control(opt, Validators.required))
          ),
          correctAnswer: [answerLetter, Validators.required],
        })
      );
    });

    if (quizData.status === 'Inactive') {
      this.quizForm.disable();
      this.isDisabled = true;
    } else {
      this.quizForm.enable();
      this.isDisabled = false;
    }

    // Store original form value for change detection (deep copy)
    this.originalFormValue = JSON.parse(JSON.stringify(this.quizForm.getRawValue()));
  }

  formatDate(date: any): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  /**
   * Check if the form has been changed from original values
   */
  hasFormChanged(): boolean {
    if (!this.originalFormValue) {
      return true; // New quiz, always allow save
    }
    const currentValue = JSON.stringify(this.quizForm.getRawValue());
    const originalValue = JSON.stringify(this.originalFormValue);
    return currentValue !== originalValue;
  }

  closeModal(): void {
    this.close.emit();
  }

  saveQuiz(): void {
    if (this.quizForm.invalid) {
      this.toastService.warning('Please fill all required fields.');
      return;
    }

    // Check if form has changed (in edit mode)
    if (this.isEditMode && !this.hasFormChanged()) {
      this.toastService.info('No changes detected. Please modify the quiz before updating.');
      return;
    }

    // Prevent double-click submission
    if (this.isSaving) {
      return;
    }
    this.isSaving = true;

    const formValue = this.quizForm.getRawValue();

    // Convert option letters to actual answer text
    formValue.questions = formValue.questions.map((q: any) => {
      const answerIndex = this.optionLetters.indexOf(q.correctAnswer);
      return {
        ...q,
        correctAnswer: answerIndex >= 0 && answerIndex < q.options.length
          ? q.options[answerIndex]
          : q.correctAnswer,
      };
    });

    this.save.emit(formValue);
  }

  /**
   * Reset saving state (called from parent after save completes)
   */
  resetSaving(): void {
    this.isSaving = false;
  }
}
