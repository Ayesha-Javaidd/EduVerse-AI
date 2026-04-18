import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { API_BASE_URL } from '../../core/constants/api.constants';
import { STORAGE_KEYS } from '../../core/constants/app.constants';
import { AdminService, SystemSettingsConfig } from '../../core/services/admin.service';
import { AuthService, User } from '../../features/auth/services/auth.service';

export interface TenantBranding {
  tenantName?: string;
  tenantLogoUrl?: string;
}

interface TenantBrandingResponse {
  tenantName?: string;
  tenantLogoUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TenantBrandingService {
  private readonly brandingSubject = new BehaviorSubject<TenantBranding | null>(null);
  readonly branding$ = this.brandingSubject.asObservable();

  private activeUserKey: string | null = null;

  constructor(
    private http: HttpClient,
    private adminService: AdminService,
    private authService: AuthService,
  ) {
    this.authService.currentUser$.subscribe((user) => {
      const nextUserKey = user ? `${user.role}:${user.id}:${user.tenantId ?? ''}` : null;

      if (!user) {
        this.activeUserKey = null;
        this.brandingSubject.next(null);
        return;
      }

      if (this.activeUserKey === nextUserKey) {
        return;
      }

      this.activeUserKey = nextUserKey;
      this.restoreStoredBranding(user.tenantId);
      this.loadCurrentBranding(user);
    });
  }

  updateBranding(branding: TenantBranding | SystemSettingsConfig | null, tenantId?: string | null): void {
    if (!branding) {
      this.brandingSubject.next(null);
      return;
    }

    const normalizedBranding: TenantBranding = {
      tenantName: branding.tenantName ?? '',
      tenantLogoUrl: branding.tenantLogoUrl ?? '',
    };

    this.brandingSubject.next(normalizedBranding);

    const currentTenantId = tenantId ?? this.authService.getUser()?.tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT_ID);
    if (currentTenantId) {
      localStorage.setItem(
        STORAGE_KEYS.tenantBranding(currentTenantId),
        JSON.stringify(normalizedBranding),
      );
    }
  }

  private loadCurrentBranding(user: User): void {
    if (user.role === 'super_admin') {
      this.brandingSubject.next(null);
      return;
    }

    if (user.role === 'admin') {
      this.adminService
        .getSystemSettings()
        .pipe(catchError(() => of(null)))
        .subscribe((settings) => {
          if (settings) {
            this.updateBranding(settings, user.tenantId);
          }
        });
      return;
    }

    const tenantId = user.tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT_ID);
    if (!tenantId) {
      return;
    }

    this.http
      .get<TenantBrandingResponse>(`${API_BASE_URL}/tenants/${tenantId}`)
      .pipe(catchError(() => of(null)))
      .subscribe((tenant) => {
        if (tenant) {
          this.updateBranding(tenant, tenantId);
        }
      });
  }

  private restoreStoredBranding(tenantId?: string | null): void {
    if (!tenantId) {
      this.brandingSubject.next(null);
      return;
    }

    const storedBranding = localStorage.getItem(STORAGE_KEYS.tenantBranding(tenantId));
    if (!storedBranding) {
      return;
    }

    try {
      this.brandingSubject.next(JSON.parse(storedBranding) as TenantBranding);
    } catch {
      this.brandingSubject.next(null);
    }
  }
}
