import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/constants/api.constants';
import { map } from 'rxjs/operators';

export interface TenantResponse {
  id: string;
  tenantName: string;
  tenantLogoUrl?: string;
  adminEmail: string;
  status: string;
  contactNumber?: string;
  address?: string;
  subscriptionId?: string;
  subscriptionCategory?: string;
  subscriptionPlan?: string;
  subscriptionBillingCycle?: string;
  subscriptionPriceMonthly?: number;
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
  gracePeriodUntil?: string;
  subscriptionNotes?: string;
  courses: number;
  teachers: number;
  students: number;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private apiUrl = `${API_BASE_URL}/tenants`;
  private selectedTenant$ = new BehaviorSubject<TenantResponse | null>(null);

  constructor(private http: HttpClient) { }

  /** Fetch live list from Backend */
  getTenantsApi(
    skip: number = 0,
    limit: number = 100,
    status?: string,
    search?: string,
    sort?: string
  ): Observable<TenantResponse[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    if (sort) params = params.set('sort', sort);

    return this.http.get<TenantResponse[]>(this.apiUrl, { params });
  }

  getTenantByIdApi(id: string): Observable<TenantResponse> {
    return this.http.get<TenantResponse>(`${this.apiUrl}/${id}`);
  }

  updateTenantApi(id: string, updates: Partial<TenantResponse>): Observable<TenantResponse> {
    return this.http.patch<TenantResponse>(`${this.apiUrl}/${id}`, updates);
  }

  deleteTenantApi(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // --- RxJS State keeping for components to pass selected items downstream --- //
  setSelectedTenant(tenant: TenantResponse | null) {
    this.selectedTenant$.next(tenant);
  }

  getSelectedTenant(): Observable<TenantResponse | null> {
    return this.selectedTenant$.asObservable();
  }
}
