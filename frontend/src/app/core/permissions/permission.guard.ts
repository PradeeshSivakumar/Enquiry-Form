import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from './permission.service';
import { map, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const permissionService = inject(PermissionService);

  // The route data should specify which module_key is required
  const moduleKey = route.data['moduleKey'];
  if (!moduleKey) {
    return true; // No module specified, allow access
  }

  // Load permissions and check
  return permissionService.loadPermissions().pipe(
    take(1),
    map(() => {
      if (permissionService.canView(moduleKey)) {
        return true;
      }
      return router.createUrlTree(['/access-denied']);
    }),
    catchError(() => of(router.createUrlTree(['/access-denied'])))
  );
};
