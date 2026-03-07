import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminTenantSettingsComponent } from './super-admin-tenant-settings.component';

describe('SuperAdminTenantSettingsComponent', () => {
  let component: SuperAdminTenantSettingsComponent;
  let fixture: ComponentFixture<SuperAdminTenantSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminTenantSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminTenantSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
