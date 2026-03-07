import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

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


  pageTitle = 'Super Admin Dashboard';
  notificationCount = 5;
  profile = {
    name: 'Super Admin',
    initials: 'S'
  };


  stats = [
    {
      title: 'Total Tenants',
      value: 48,
      icon: 'fa-solid fa-building',
      iconBgClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
      bgColor: 'bg-white'
    },
    {
      title: 'Active Users',
      value: '12.5K',
      icon: 'fa-solid fa-users',
      iconBgClass: 'bg-green-100',
      iconColorClass: 'text-green-600',
      bgColor: 'bg-white'
    },
    {
      title: 'Total Courses',
      value: 842,
      icon: 'fa-solid fa-book',
      iconBgClass: 'bg-purple-100',
      iconColorClass: 'text-purple-600',
      bgColor: 'bg-white'
    },
    {
      title: 'Revenue',
      value: '$48.2K',
      icon: 'fa-solid fa-dollar-sign',
      iconBgClass: 'bg-yellow-100',
      iconColorClass: 'text-yellow-600',
      bgColor: 'bg-white'
    }
  ];

  /* 
     Used for line/bar chart visualization to represent
     growth of tenants per month over time.
     */
  tenantGrowthData = [
    { month: 'Jan', tenants: 32 },
    { month: 'Feb', tenants: 35 },
    { month: 'Mar', tenants: 38 },
    { month: 'Apr', tenants: 41 },
    { month: 'May', tenants: 44 },
    { month: 'Jun', tenants: 48 }
  ];

  /*
     Represents tenant or user activity distribution in
     categories such as Active, Pending, and Inactive.
     This data is used for donut or progress charts.
     */
  activityData = [
    { category: 'Active', value: 35, color: 'bg-green-500' },
    { category: 'Pending', value: 8, color: 'bg-yellow-500' },
    { category: 'Inactive', value: 5, color: 'bg-red-500' }
  ];

  /* 
     Displays a list of top-performing or active tenants
     (organizations). Each row shows name, active courses,
     and total users.
     */
  organizationColumns: TableColumn[] = [
    { key: 'name', label: 'Organization Name', type: 'text' },
    { key: 'activeCourses', label: 'Active Courses', type: 'text' },
    { key: 'users', label: 'Users', type: 'text' }
  ];

  // Top 5 organizations (manually provided for dashboard display)
  organizationRows = [
    { name: 'Punjab University', activeCourses: 45, users: 1250 },
    { name: 'Skills Academy', activeCourses: 38, users: 980 },
    { name: 'Qazi Schools', activeCourses: 52, users: 1420 },
    { name: 'Punjab Colleges', activeCourses: 31, users: 765 },
    { name: 'Comsats University', activeCourses: 28, users: 690 }
  ];

  // Total tenants in the system (used for summary)
  totalOrganizations = 48;

  /*
     Runs once when the component initializes. 
     Can be used for fetching data or setup logic.
      */
  ngOnInit(): void {
    // Future: Load dashboard data dynamically from backend service
  }

  /* 
     Helper functions used by the chart templates to 
     calculate proportional values for rendering.
     */

  // Returns maximum tenant count to normalize bar height
  get maxTenantValue(): number {
    return Math.max(...this.tenantGrowthData.map(d => d.tenants));
  }

  // Calculates total of all activity categories (for percentage)
  get totalActivityValue(): number {
    return this.activityData.reduce((sum, item) => sum + item.value, 0);
  }

  // Converts a tenant count to height percentage for bar chart
  getBarHeight(value: number): number {
    return (value / this.maxTenantValue) * 100;
  }

  // Converts a value to its percentage of total (for donut chart)
  getPercentage(value: number): number {
    return (value / this.totalActivityValue) * 100;
  }

  /* 
     Event handlers for clickable icons in the header bar.
     (Future: Can integrate with real routing or modals)
      */

  // Triggered when user clicks notifications bell
  onNotificationClick(): void {

  }

  // Triggered when user clicks profile/avatar
  onProfileClick(): void {

  }

  // Triggered when user clicks logout button
  onLogoutClick(): void {

  }
}
