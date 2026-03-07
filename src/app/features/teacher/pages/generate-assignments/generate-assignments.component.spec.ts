import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateAssignmentsComponent } from './generate-assignments.component';

describe('GenerateAssignmentsComponent', () => {
  let component: GenerateAssignmentsComponent;
  let fixture: ComponentFixture<GenerateAssignmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateAssignmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
