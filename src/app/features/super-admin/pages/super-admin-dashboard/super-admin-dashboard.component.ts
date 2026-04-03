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
      title: 'Total Organizations',
      value: 0 as string | number,
      icon: 'fa-solid fa-building',
      iconBgClass: 'bg-[#23A997]/10',
      iconColorClass: 'text-[#23A997]',
    },
    {
      title: 'Active',
      value: 0 as string | number,
      icon: 'fa-solid fa-circle-check',
      iconBgClass: 'bg-green-500/10',
      iconColorClass: 'text-green-500',
    },
    {
      title: 'Inactive',
      value: 0 as string | number,
      icon: 'fa-solid fa-circle-xmark',
      iconBgClass: 'bg-red-500/10',
      iconColorClass: 'text-red-500',
    },
    {
      title: 'Revenue',
      value: '$0' as string | number,
      icon: 'fa-solid fa-dollar-sign',
      iconBgClass: 'bg-[#23A997]/10',
      iconColorClass: 'text-[#23A997]',
    }
  ];

  tenantGrowthData: TenantGrowthPoint[] = [];
  activityData: ActivityDataPoint[] = [];

  organizationColumns: TableColumn[] = [
    { key: 'name', label: 'Organization Name', type: 'text' },
    { key: 'teachers', label: 'Teachers', type: 'text' },
    { key: 'students', label: 'Students', type: 'text' },
    { key: 'courses', label: 'Courses', type: 'text' }
  ];

  organizationRows: OrganizationRow[] = [];
  totalOrganizations = 0;

  ngOnInit(): void {
    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats[0].value = data.totalTenants;
        // Pull Active and Inactive from activityData
        const activeItem = data.activityData.find(a => a.category === 'Active');
        const inactiveItem = data.activityData.find(a => a.category === 'Inactive');
        this.stats[1].value = activeItem?.value ?? 0;
        this.stats[2].value = inactiveItem?.value ?? 0;
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

  /** Round up to a "nice" max for clean Y-axis ticks */
  get niceMax(): number {
    const raw = this.maxTenantValue;
    if (raw <= 4) return Math.max(raw, 1); // Keep exact for small values
    if (raw <= 10) return Math.ceil(raw / 2) * 2; // Round to nearest 2
    return Math.ceil(raw / 5) * 5; // Round to nearest 5
  }

  /** Generate Y-axis tick values (top to bottom), avoiding duplicates */
  get yAxisTicks(): number[] {
    const max = this.niceMax;
    // For small values (≤4), use integer steps: [max, max-1, ..., 0]
    if (max <= 4) {
      const ticks: number[] = [];
      for (let i = max; i >= 0; i--) { ticks.push(i); }
      return ticks;
    }
    // For larger values, use 4 even divisions
    const step = max / 4;
    return [max, Math.round(step * 3), Math.round(step * 2), Math.round(step), 0];
  }

  get totalActivityValue(): number {
    return this.activityData.reduce((sum, item) => sum + item.value, 0);
  }

  /** Returns pixel height for a bar (280px = chart area height) */
  getBarHeightPx(value: number): number {
    if (this.niceMax === 0) return 0;
    return (value / this.niceMax) * 280;
  }

  getPercentage(value: number): number {
    if (this.totalActivityValue === 0) return 0;
    return (value / this.totalActivityValue) * 100;
  }

  onNotificationClick(): void {}
  onProfileClick(): void {}
  onLogoutClick(): void {}
}
