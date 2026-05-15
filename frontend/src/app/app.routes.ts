import { Routes } from '@angular/router';
import { authChildGuard, authGuard } from './core/auth/auth.guard';

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
    path: '',
    loadComponent: () => import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
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
      }
    ]
  },
  { path: '**', redirectTo: '' },
];
