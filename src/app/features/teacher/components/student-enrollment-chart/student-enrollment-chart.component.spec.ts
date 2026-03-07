import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentEnrollmentChartComponent } from './student-enrollment-chart.component';

describe('StudentEnrollmentChartComponent', () => {
  let component: StudentEnrollmentChartComponent;
  let fixture: ComponentFixture<StudentEnrollmentChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentEnrollmentChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentEnrollmentChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
