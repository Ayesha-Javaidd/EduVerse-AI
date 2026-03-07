import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressSnapshotComponent } from './progress-snapshot.component';

describe('ProgressSnapshotComponent', () => {
  let component: ProgressSnapshotComponent;
  let fixture: ComponentFixture<ProgressSnapshotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressSnapshotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgressSnapshotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
