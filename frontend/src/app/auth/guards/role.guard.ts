import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

export const PRODUCT_MASTER_ROLES = ['Admin', 'Super Admin', 'Sales Manager'];

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  if (!allowedRoles?.length || authService.hasRole(allowedRoles)) {
    return true;
  }

  return router.createUrlTree(['/access-denied']);
};
