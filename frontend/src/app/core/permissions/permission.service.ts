import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, map, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface ModulePermission {
  module_id: number;
  module_name: string;
  module_key: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_view_details?: boolean;
  can_manage_permissions?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.baseUrl + '/api/roles';

  // Cache permissions
  private permissions = signal<ModulePermission[]>([]);
  private loaded = signal<boolean>(false);

  constructor() {
    // When auth status changes (e.g., login), we should reload permissions
    // For now, we can just fetch on demand if not loaded
  }

  loadPermissions(): Observable<ModulePermission[]> {
    const roleName = this.authService.getUserRole();
    if (!roleName) {
      this.permissions.set([]);
      this.loaded.set(true);
      return of([]);
    }

    // Admin bypass is handled by backend, but we can also just hardcode true for Admin here
    if (roleName.toLowerCase() === 'admin') {
      // Mock all permissions as true for Admin to avoid unnecessary API call
      // Or just let the backend return the truth. Let's call backend for consistency.
    }

    return this.http.get<ModulePermission[]>(`${this.apiUrl}/${roleName}/permissions`).pipe(
      tap(perms => {
        this.permissions.set(perms || []);
        this.loaded.set(true);
      }),
      catchError(() => {
        this.permissions.set([]);
        this.loaded.set(true);
        return of([]);
      })
    );
  }

  getPermissions(): ModulePermission[] {
    return this.permissions();
  }

  private getModulePerm(moduleKey: string): ModulePermission | undefined {
    return this.permissions().find(p => p.module_key === moduleKey);
  }

  // Action checks
  canView(moduleKey: string): boolean {
    if (this.isAdmin()) return true;
    return !!this.getModulePerm(moduleKey)?.can_view;
  }

  canAdd(moduleKey: string): boolean {
    if (this.isAdmin()) return true;
    return !!this.getModulePerm(moduleKey)?.can_add;
  }

  canEdit(moduleKey: string): boolean {
    if (this.isAdmin()) return true;
    return !!this.getModulePerm(moduleKey)?.can_edit;
  }

  canDelete(moduleKey: string): boolean {
    if (this.isAdmin()) return true;
    return !!this.getModulePerm(moduleKey)?.can_delete;
  }

  canExport(moduleKey: string): boolean {
    if (this.isAdmin()) return true;
    return !!this.getModulePerm(moduleKey)?.can_export;
  }

  canViewDetails(moduleKey: string): boolean {
    if (this.isAdmin()) return true;
    return !!this.getModulePerm(moduleKey)?.can_view_details;
  }

  canManagePermissions(moduleKey: string): boolean {
    if (this.isAdmin()) return true;
    return !!this.getModulePerm(moduleKey)?.can_manage_permissions;
  }

  private isAdmin(): boolean {
    const role = this.authService.getUserRole();
    return !!role && role.toLowerCase() === 'admin';
  }
}
