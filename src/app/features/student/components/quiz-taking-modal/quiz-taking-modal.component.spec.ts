import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizTakingModalComponent } from './quiz-taking-modal.component';

describe('QuizTakingModalComponent', () => {
  let component: QuizTakingModalComponent;
  let fixture: ComponentFixture<QuizTakingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizTakingModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizTakingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
