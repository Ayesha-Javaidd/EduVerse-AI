import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import {
  DataTableComponent,
  TableColumn,
} from '../../../../shared/components/data-table/data-table.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TenantService, TenantResponse } from '../../services/tenant.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-super-admin-tenants',
  standalone: true,
  imports: [
    HeaderComponent,
    DataTableComponent,
    StatCardComponent,
    CommonModule,
  ],
  templateUrl: './super-admin-tenants.component.html',
  styleUrl: './super-admin-tenants.component.css',
})
export class SuperAdminTenantsComponent implements OnInit {
  stats = [
    {
      title: 'Loading Data...',
      value: '-' as string | number,
      icon: 'fa-solid fa-building',
      iconBgClass: 'bg-[#23A997]/10',
      iconColorClass: 'text-[#23A997]',
    }
  ];

  columns: TableColumn[] = [
    { key: 'tenantName', label: 'Organization Name', type: 'text' },
    { key: 'adminEmail', label: 'Admin Email', type: 'text' },
    { key: 'courses', label: 'Courses', type: 'text' },
    { key: 'teachers', label: 'Teachers', type: 'text' },
    { key: 'students', label: 'Students', type: 'text' },
    {
      key: 'subscriptionStatusLabel',
      label: 'Plan',
      type: 'badge',
    },
  ];

  tenants: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;

  constructor(
    private router: Router,
    private tenantService: TenantService,
    private confirmDialogService: ConfirmDialogService
  ) {}

  ngOnInit() {
    this.loadTenants();
  }

  loadTenants() {
    this.tenantService.getTenantsApi(
      (this.currentPage - 1) * this.pageSize, 
      this.pageSize
    ).subscribe({
      next: (data) => {
        // Map data to create derived properties for UI like subscriptionStatusLabel
        this.tenants = data.map(t => ({
          ...t,
          subscriptionStatusLabel: t.subscriptionPlan || 'No Plan'
        }));
        this.totalItems = this.tenants.length; // Actually, server should return total count. But array slice length works for now.
        
        // Update stats from loaded tenant data
        const totalTeachers = data.reduce((sum, t) => sum + (t.teachers || 0), 0);
        const totalStudents = data.reduce((sum, t) => sum + (t.students || 0), 0);
        const totalCourses = data.reduce((sum, t) => sum + (t.courses || 0), 0);

        this.stats = [
          {
            title: 'Total Teachers',
            value: totalTeachers,
            icon: 'fa-solid fa-chalkboard-user',
            iconBgClass: 'bg-[#23A997]/10',
            iconColorClass: 'text-[#23A997]',
          },
          {
            title: 'Total Students',
            value: totalStudents,
            icon: 'fa-solid fa-user-graduate',
            iconBgClass: 'bg-blue-500/10',
            iconColorClass: 'text-blue-500',
          },
          {
            title: 'Total Courses',
            value: totalCourses,
            icon: 'fa-solid fa-book-open',
            iconBgClass: 'bg-amber-500/10',
            iconColorClass: 'text-amber-500',
          }
        ];
      },
      error: (err) => console.error("Error fetching tenants from backend", err)
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadTenants();
  }

  onActionClick(tenant: any) {
    this.router.navigate(['/super-admin/tenants', tenant.id]);
  }

  onEdit(tenant: any) {
    this.tenantService.setSelectedTenant(tenant);
    this.router.navigate(['/super-admin/tenant-settings', tenant.id]);
  }

  async onDelete(tenant: any) {
    const isConfirmed = await this.confirmDialogService.confirmDelete(tenant.tenantName || 'this tenant');
    if (isConfirmed) {
      this.tenantService.deleteTenantApi(tenant.id).subscribe({
        next: () => {
          this.loadTenants(); // Re-fetch the live list
        },
        error: (err) => console.error("Failed to delete the tenant via API", err)
      });
    }
  }
}
