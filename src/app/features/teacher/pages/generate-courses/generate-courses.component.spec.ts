import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateCoursesComponent } from './generate-courses.component';

describe('GenerateCoursesComponent', () => {
  let component: GenerateCoursesComponent;
  let fixture: ComponentFixture<GenerateCoursesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateCoursesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateCoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
