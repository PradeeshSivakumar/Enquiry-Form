import { Routes } from '@angular/router';
import { authChildGuard, authGuard } from './core/auth/auth.guard';
import { PRODUCT_MASTER_ROLES, roleGuard } from './auth/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/enquiry-form/pages/enquiry-form-page.component').then((m) => m.EnquiryFormPageComponent),
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'access-denied',
    loadComponent: () => import('./features/auth/pages/access-denied-page.component').then((m) => m.AccessDeniedPageComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/Dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'visitors-directory',
        loadComponent: () => import('./features/visitors/pages/visitors-page/visitors-page').then((m) => m.VisitorsPage),
      },
      {
        path: 'employee',
        loadComponent: () => import('./features/employee/pages/employee-page/employee-page.component').then((m) => m.EmployeePageComponent),
      },
      {
        path: 'venue',
        loadComponent: () => import('./features/venue/pages/venue-page/venue-page.component').then((m) => m.VenuePageComponent),
      },
      {
        path: 'products',
        canActivate: [roleGuard],
        data: { roles: PRODUCT_MASTER_ROLES },
        loadComponent: () => import('./features/products/pages/products-page/products-page.component').then((m) => m.ProductsPageComponent),
      }
    ]
  },
  { path: '**', redirectTo: '' },
];
