import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TenantSectionComponent } from './tenant-section.component';

describe('TenantSectionComponent', () => {
  let component: TenantSectionComponent;
  let fixture: ComponentFixture<TenantSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TenantSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
