import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalShellComponent } from './modal-shell.component';

describe('ModalShellComponent', () => {
  let component: ModalShellComponent;
  let fixture: ComponentFixture<ModalShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
