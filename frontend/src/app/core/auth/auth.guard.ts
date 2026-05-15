import { inject } from '@angular/core';
import { Router, type CanActivateChildFn, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

const requireAuthentication = (stateUrl: string) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: stateUrl } });
};

export const authGuard: CanActivateFn = (_route, state) => requireAuthentication(state.url);

export const authChildGuard: CanActivateChildFn = (_childRoute, state) => requireAuthentication(state.url);
