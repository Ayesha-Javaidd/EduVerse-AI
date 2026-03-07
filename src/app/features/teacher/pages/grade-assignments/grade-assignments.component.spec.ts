import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeAssignmentsComponent } from './grade-assignments.component';

describe('GradeAssignmentsComponent', () => {
  let component: GradeAssignmentsComponent;
  let fixture: ComponentFixture<GradeAssignmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeAssignmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradeAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
