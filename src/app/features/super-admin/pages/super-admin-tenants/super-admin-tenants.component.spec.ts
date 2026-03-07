import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminTenantsComponent } from './super-admin-tenants.component';

describe('SuperAdminTenantsComponent', () => {
  let component: SuperAdminTenantsComponent;
  let fixture: ComponentFixture<SuperAdminTenantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminTenantsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminTenantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
