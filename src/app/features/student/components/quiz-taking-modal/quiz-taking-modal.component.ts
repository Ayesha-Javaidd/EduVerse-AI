import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quiz-taking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './quiz-taking-modal.component.html',
  styleUrls: ['./quiz-taking-modal.component.css'],
})
export class QuizTakingModalComponent implements OnInit {
  @Input() quiz: any = null; // quiz data with questions
  @Input() viewOnly = false; // when viewing results
  @Output() close = new EventEmitter<void>();
  @Output() complete = new EventEmitter<any>(); // emits score + selected answers

  quizForm!: FormGroup;
  submitted = false;
  score = 0;

  // Option letters for display
  optionLetters = ['a', 'b', 'c', 'd'];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initForm();

    if (this.quiz) {
      this.populateFormWithQuizData(this.quiz);
    }

    if (this.viewOnly) {
      this.quizForm.disable();
      this.submitted = true;
      this.score = this.quiz.score ?? 0;
    }
  }

  initForm(): void {
    this.quizForm = this.fb.group({
      id: [null],
      quizNo: [''],
      course: [''],
      description: [''],
      questions: this.fb.array([]),
    });
  }

  get questions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  /**
   * Get the letter for a given option index (0 -> 'a', 1 -> 'b', etc.)
   */
  getOptionLetter(index: number): string {
    return this.optionLetters[index] || '';
  }

  populateFormWithQuizData(quizData: any): void {
    this.quizForm.patchValue({
      id: quizData.id,
      quizNo: quizData.quizNo,
      course: quizData.course,
      description: quizData.description,
    });

    const qArray = this.quizForm.get('questions') as FormArray;
    qArray.clear();

    quizData.questions.forEach((q: any) => {
      qArray.push(
        this.fb.group({
          statement: [q.statement],
          options: [q.options],
          correctAnswer: [q.correctAnswer],
          selectedAnswer: [q.selectedAnswer || '', Validators.required],
        })
      );
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  submitQuiz(): void {
    if (this.quizForm.invalid) {
      alert('Please select an answer for all questions.');
      return;
    }

    const formValue = this.quizForm.getRawValue();
    let correctCount = 0;

    formValue.questions.forEach((q: any) => {
      if (q.selectedAnswer === q.correctAnswer) {
        correctCount++;
      }
    });

    this.score = correctCount;
    this.submitted = true;

    this.complete.emit({
      ...formValue,
      score: this.score,
      totalQuestions: formValue.questions.length,
      status: 'Completed',
    });
  }

  getResultClass(q: any, option: string): string {
    if (!this.submitted) return '';

    const correct = q.value.correctAnswer;
    const selected = q.value.selectedAnswer;

    if (option === correct) return 'bg-green-100 border-2 border-green-500';
    if (option === selected && option !== correct)
      return 'bg-red-100 border-2 border-red-500';
    return 'border';
  }
}
