import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeAssignmentModalComponent } from './grade-assignment-modal.component';

describe('GradeAssignmentModalComponent', () => {
  let component: GradeAssignmentModalComponent;
  let fixture: ComponentFixture<GradeAssignmentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeAssignmentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradeAssignmentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
