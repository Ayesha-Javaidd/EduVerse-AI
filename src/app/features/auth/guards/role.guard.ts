import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role Guard
 * Usage:
 * canActivate: [AuthGuard, RoleGuard]
 * data: { roles: ['admin', 'teacher'] }
 */
export const RoleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles: string[] = route.data['roles'] ?? [];
  const userRole = authService.getRole();

  // Not logged in
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Role mismatch
  if (!userRole || !expectedRoles.includes(userRole)) {
    redirectByRole(authService, router);
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
