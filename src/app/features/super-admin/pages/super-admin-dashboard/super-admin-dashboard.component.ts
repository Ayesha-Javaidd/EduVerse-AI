import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SuperAdminDashboardService, ActivityDataPoint, OrganizationRow, TenantGrowthPoint } from '../../../../shared/services/super-admin-dashboard.service';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    DataTableComponent,
    HeaderComponent
  ],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.css']
})
export class SuperadminDashboardComponent implements OnInit {

  constructor(private dashboardService: SuperAdminDashboardService) {}

  pageTitle = 'Super Admin Dashboard';
  notificationCount = 5;
  profile = {
    name: 'Super Admin',
    initials: 'S'
  };

  stats = [
    {
      title: 'Total Tenants',
      value: 0 as string | number,
      icon: 'fa-solid fa-building',
      iconBgClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
      bgColor: 'bg-white'
    },
    {
      title: 'Active Users',
      value: '0' as string | number,
      icon: 'fa-solid fa-users',
      iconBgClass: 'bg-green-100',
      iconColorClass: 'text-green-600',
      bgColor: 'bg-white'
    },
    {
      title: 'Total Courses',
      value: 0 as string | number,
      icon: 'fa-solid fa-book',
      iconBgClass: 'bg-purple-100',
      iconColorClass: 'text-purple-600',
      bgColor: 'bg-white'
    },
    {
      title: 'Revenue',
      value: '$0' as string | number,
      icon: 'fa-solid fa-dollar-sign',
      iconBgClass: 'bg-yellow-100',
      iconColorClass: 'text-yellow-600',
      bgColor: 'bg-white'
    }
  ];

  tenantGrowthData: TenantGrowthPoint[] = [];
  activityData: ActivityDataPoint[] = [];

  organizationColumns: TableColumn[] = [
    { key: 'name', label: 'Organization Name', type: 'text' },
    { key: 'activeCourses', label: 'Active Courses', type: 'text' },
    { key: 'users', label: 'Users', type: 'text' }
  ];

  organizationRows: OrganizationRow[] = [];
  totalOrganizations = 0;

  ngOnInit(): void {
    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats[0].value = data.totalTenants;
        this.stats[1].value = data.activeUsers;
        this.stats[2].value = data.totalCourses;
        this.stats[3].value = data.revenue;

        this.tenantGrowthData = data.tenantGrowthData;
        this.activityData = data.activityData;
        this.organizationRows = data.organizationRows;
        this.totalOrganizations = data.totalTenants;
      },
      error: (err: any) => console.error("Error fetching Super Admin stats", err)
    });
  }

  get maxTenantValue(): number {
    if (this.tenantGrowthData.length === 0) return 1;
    return Math.max(...this.tenantGrowthData.map(d => d.tenants));
  }

  get totalActivityValue(): number {
    return this.activityData.reduce((sum, item) => sum + item.value, 0);
  }

  getBarHeight(value: number): number {
    if (this.maxTenantValue === 0) return 0;
    return (value / this.maxTenantValue) * 100;
  }

  getPercentage(value: number): number {
    if (this.totalActivityValue === 0) return 0;
    return (value / this.totalActivityValue) * 100;
  }

  onNotificationClick(): void {}
  onProfileClick(): void {}
  onLogoutClick(): void {}
}
