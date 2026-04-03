import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/api.constants';

export interface ActivityDataPoint {
  category: string;
  value: number;
  color: string;
}

export interface OrganizationRow {
  name: string;
  teachers: number;
  students: number;
  courses: number;
}

export interface TenantGrowthPoint {
  month: string;
  tenants: number;
}

export interface SuperAdminDashboardStats {
  totalTenants: number;
  activeUsers: string;
  totalCourses: number;
  revenue: string;
  tenantGrowthData: TenantGrowthPoint[];
  activityData: ActivityDataPoint[];
  organizationRows: OrganizationRow[];
}

@Injectable({
  providedIn: 'root'
})
export class SuperAdminDashboardService {

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<SuperAdminDashboardStats> {
    return this.http.get<SuperAdminDashboardStats>(`${API_BASE_URL}/super-admin/dashboard/stats`);
  }
}
