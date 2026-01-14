import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard
 * - Blocks unauthenticated users
 * - Prevents authenticated users from accessing login/signup
 */
export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
  const path = route.routeConfig?.path;

  // Block authenticated users from auth pages
  if (isAuthenticated && (path === 'login' || path === 'signup')) {
    redirectByRole(authService, router);
    return false;
  }

  // Block unauthenticated users from protected routes
  if (!isAuthenticated && state.url !== '/login' && state.url !== '/signup') {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  return true;
};

function redirectByRole(authService: AuthService, router: Router) {
  const role = authService.getRole();

  switch (role) {
    case 'admin':
      router.navigate(['/admin/dashboard']);
      break;
    case 'teacher':
      router.navigate(['/teacher/dashboard']);
      break;
    case 'student':
      router.navigate(['/student/dashboard']);
      break;
    case 'super_admin':
      router.navigate(['/super-admin/dashboard']);
      break;
    default:
      router.navigate(['/login']);
  }
}
