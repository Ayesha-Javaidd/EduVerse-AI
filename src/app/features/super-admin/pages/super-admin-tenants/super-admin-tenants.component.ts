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
  stats: any[] = [
    {
      title: 'Loading Data...',
      value: '-',
      icon: 'fa-solid fa-building',
      bgColor: 'bg-blue-50',
      iconBgClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
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
      label: 'Subscription',
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
          subscriptionStatusLabel: t.subscriptionPlan ? 'Paid' : 'No Plan'
        }));
        this.totalItems = this.tenants.length; // Actually, server should return total count. But array slice length works for now.
        
        // Update basic top stat
        this.stats = [
          {
            title: 'Total Organizations',
            value: this.tenants.length,
            icon: 'fa-solid fa-building',
            bgColor: 'bg-blue-50',
            iconBgClass: 'bg-blue-100',
            iconColorClass: 'text-blue-600',
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
