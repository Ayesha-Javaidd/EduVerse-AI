import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/constants/api.constants';

export interface SubscriptionPlan {
  id?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionPlansService {
  private apiUrl = `${API_BASE_URL}/subscription-plans`;

  constructor(private http: HttpClient) {}

  getAllPlans(statusFilter?: string): Observable<SubscriptionPlan[]> {
    let params = new HttpParams();
    if (statusFilter) {
      params = params.set('status', statusFilter);
    }
    return this.http.get<SubscriptionPlan[]>(this.apiUrl, { params });
  }

  getPlanById(id: string): Observable<SubscriptionPlan> {
    return this.http.get<SubscriptionPlan>(`${this.apiUrl}/${id}`);
  }

  createPlan(plan: SubscriptionPlan): Observable<SubscriptionPlan> {
    return this.http.post<SubscriptionPlan>(this.apiUrl, plan);
  }

  updatePlan(id: string, plan: Partial<SubscriptionPlan>): Observable<SubscriptionPlan> {
    return this.http.patch<SubscriptionPlan>(`${this.apiUrl}/${id}`, plan);
  }

  deletePlan(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
