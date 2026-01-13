import { Component } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import {
  DataTableComponent,
  TableColumn,
} from '../../../../shared/components/data-table/data-table.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TenantService } from '../../services/tenant.service';

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
export class SuperAdminTenantsComponent {
  stats: TenantStats[] = [
    {
      title: 'Total Organizations',
      value: 24,
      icon: 'fa-solid fa-building',
      bgColor: 'bg-blue-50',
      iconBgClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
    },
    {
      title: 'Active Subscriptions',
      value: 18,
      icon: 'fa-solid fa-circle-check',
      bgColor: 'bg-green-50',
      iconBgClass: 'bg-green-100',
      iconColorClass: 'text-green-600',
    },
    {
      title: 'Total Courses',
      value: 342,
      icon: 'fa-solid fa-book',
      bgColor: 'bg-yellow-50',
      iconBgClass: 'bg-yellow-100',
      iconColorClass: 'text-yellow-600',
    },
    {
      title: 'Total Revenue',
      value: '$12,450',
      icon: 'fa-solid fa-dollar-sign',
      bgColor: 'bg-purple-50',
      iconBgClass: 'bg-purple-100',
      iconColorClass: 'text-purple-600',
    },
  ];

  columns: TableColumn[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'courses', label: 'Courses', type: 'text' },
    { key: 'teachers', label: 'Teachers', type: 'text' },
    { key: 'students', label: 'Students', type: 'text' },
    {
      key: 'subscription',
      label: 'Subscription',
      type: 'badge',
      badgeColors: {
        Paid: 'bg-green-100 text-green-800',
        Free: 'bg-yellow-100 text-yellow-800',
        Trial: 'bg-blue-100 text-blue-800',
        Expired: 'bg-red-100 text-red-800',
      },
    },
  ];

  tenants: any[] = [];

  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;

  constructor(private router: Router, private tenantService: TenantService) { }

  ngOnInit() {
    this.tenants = this.tenantService.getTenants();
    this.totalItems = this.tenants.length;
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onActionClick(tenant: any) {

    this.router.navigate(['/super-admin/tenants', tenant.id]);
  }

  onEdit(tenant: any) {

    // this.router.navigate(['/super-admin/tenant-settings']);
    this.tenantService.setSelectedTenant(tenant);
    this.router.navigate(['/super-admin/tenant-settings', tenant.id]);
  }

  onDelete(tenant: any) {

    if (confirm(`Are you sure you want to delete ${tenant.name}?`)) {
      this.tenants = this.tenants.filter((t) => t.id !== tenant.id);
      this.totalItems = this.tenants.length;
    }
  }
}

interface StatCard {
  title: string;
  value: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
}

interface TenantStats {
  title: string;
  value: number | string;
  icon: string;
  bgColor: string;
  iconBgClass: string;
  iconColorClass: string;
}

interface Tenant {
  id: number;
  name: string;
  email: string;
  courses: number;
  teachers: number;
  students: number;
  subscription: 'Paid' | 'Free' | 'Trial' | 'Expired';
  isActive: boolean;
}
