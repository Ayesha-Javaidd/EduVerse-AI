import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';

export interface PublicSubscriptionPlan {
  id: string;
  code: string;
  name: string;
  category: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  pricePerMonth: number;
  maxStudents?: number | null;
  maxTeachers?: number | null;
  maxCourses?: number | null;
  aiCredits?: number | null;
  storageGb?: number | null;
  description?: string | null;
  features: string[];
  status: 'active' | 'inactive';
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionPlanService {
  private readonly publicApiUrl = `${API_BASE_URL}/subscription-plans/public`;

  constructor(private http: HttpClient) {}

  getPublicPlans(statusFilter: string = 'active'): Observable<PublicSubscriptionPlan[]> {
    const params = new HttpParams().set('status', statusFilter);
    return this.http.get<PublicSubscriptionPlan[]>(this.publicApiUrl, { params });
  }
}
