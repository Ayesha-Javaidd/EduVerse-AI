import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiDemoComponent } from './ai-demo.component';

describe('AiDemoComponent', () => {
  let component: AiDemoComponent;
  let fixture: ComponentFixture<AiDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiDemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
