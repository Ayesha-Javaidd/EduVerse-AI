import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/constants/api.constants';

export interface SuperAdminResponse {
  id: string;
  userId: string;
  user: {
    fullName: string;
    email: string;
    role: string;
    status: string;
    profileImageURL?: string;
    contactNo?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {
  private apiUrl = `${API_BASE_URL}/super-admin`;

  constructor(private http: HttpClient) { }

  getProfile(): Observable<SuperAdminResponse> {
    return this.http.get<SuperAdminResponse>(`${this.apiUrl}/me`);
  }

  updateProfile(payload: any): Observable<SuperAdminResponse> {
    return this.http.patch<SuperAdminResponse>(`${this.apiUrl}/me`, payload);
  }
}
