import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackStudentComponent } from './track-student.component';

describe('TrackStudentComponent', () => {
  let component: TrackStudentComponent;
  let fixture: ComponentFixture<TrackStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackStudentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
