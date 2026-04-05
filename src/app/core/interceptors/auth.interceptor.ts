import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../../features/auth/services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken(); // string | null
  const isPublicPricingRequest = req.url.includes('/subscription-plans/public');

  if (token && !isPublicPricingRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401 && !isPublicPricingRequest) {
        authService.logout(); // global logout
      }
      return throwError(() => err);
    }),
  );
};
