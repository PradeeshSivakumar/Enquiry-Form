import { Routes } from '@angular/router';
import { authChildGuard, authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/permissions/permission.guard';
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
        canActivate: [permissionGuard],
        data: { moduleKey: 'dashboard' }
      },
      {
        path: 'visitors-directory',
        loadComponent: () => import('./features/visitors/pages/visitors-page/visitors-page').then((m) => m.VisitorsPage),
        canActivate: [permissionGuard],
        data: { moduleKey: 'visitors_directory' }
      },
      {
        path: 'employee',
        loadComponent: () => import('./features/employee/pages/employee-page/employee-page.component').then((m) => m.EmployeePageComponent),
        canActivate: [permissionGuard],
        data: { moduleKey: 'employees' }
      },
      {
        path: 'venue',
        loadComponent: () => import('./features/venue/pages/venue-page/venue-page.component').then((m) => m.VenuePageComponent),
        canActivate: [permissionGuard],
        data: { moduleKey: 'venues' }
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/pages/products-page/products-page.component').then((m) => m.ProductsPageComponent),
        canActivate: [permissionGuard],
        data: { moduleKey: 'products' }
      },
      {
        path: 'departments',
        loadComponent: () => import('./features/department/pages/departments-page/departments-page.component').then((m) => m.DepartmentsPageComponent),
        canActivate: [permissionGuard],
        data: { moduleKey: 'departments' }
      },
      {
        path: 'lead-categories',
        loadComponent: () => import('./features/lead-category/pages/lead-category-page/lead-category-page.component').then((m) => m.LeadCategoryPageComponent),
        canActivate: [permissionGuard],
        data: { moduleKey: 'lead_categories' }
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/pages/roles-page/roles-page.component').then((m) => m.RolesPageComponent),
        canActivate: [permissionGuard],
        data: { moduleKey: 'roles' }
      },
      {
        path: 'email-campaigns',
        loadComponent: () => import('./features/email-campaigns/pages/email-campaigns-page/email-campaigns-page.component').then((m) => m.EmailCampaignsPageComponent),
        canActivate: [permissionGuard],
        data: { moduleKey: 'email_campaigns' }
      }
    ]
  },
  { path: '**', redirectTo: '' },
];
