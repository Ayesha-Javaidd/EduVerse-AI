import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentAssignmentModalComponent } from './student-assignment-modal.component';

describe('StudentAssignmentModalComponent', () => {
  let component: StudentAssignmentModalComponent;
  let fixture: ComponentFixture<StudentAssignmentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentAssignmentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentAssignmentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
