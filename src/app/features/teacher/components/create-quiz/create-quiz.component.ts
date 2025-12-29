import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';

// Import Course model
import { Course } from '../../../../shared/models/course.model';

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
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  quizForm!: FormGroup;
  isEditMode = false;
  isDisabled = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();

    if (this.quiz) {
      this.isEditMode = true;
      this.populateFormWithQuizData(this.quiz);
    }
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
      options: this.fb.array(
        Array(4).fill('').map(() => this.fb.control('', Validators.required))
      ),
      correctAnswer: ['', Validators.required],
    });
  }

  get questions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  getOptions(i: number): FormArray {
    return this.questions.at(i).get('options') as FormArray;
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
      qArray.push(
        this.fb.group({
          statement: [q.statement, Validators.required],
          options: this.fb.array(
            q.options.map((opt: string) => this.fb.control(opt, Validators.required))
          ),
          correctAnswer: [q.correctAnswer, Validators.required],
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
  }

  formatDate(date: any): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  closeModal(): void {
    this.close.emit();
  }

  saveQuiz(): void {
    if (this.quizForm.invalid) {
      alert('Please fill all required fields.');
      return;
    }
    this.save.emit(this.quizForm.getRawValue());
  }
}
