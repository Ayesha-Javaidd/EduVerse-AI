import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TenantInfoFormComponent } from './tenant-info-form.component';

describe('TenantInfoFormComponent', () => {
  let component: TenantInfoFormComponent;
  let fixture: ComponentFixture<TenantInfoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantInfoFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TenantInfoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
