import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Role {
  id?: number;
  role_id?: string;
  name: string;
  description?: string;
  is_active?: number;
  is_deleted?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ModuleItem {
  id: number;
  name: string;
  module_key: string;
  sidebar_item_id: number;
  sort_order: number;
  is_active: number;
}

export interface RolePermission {
  module_id: number;
  module_name: string;
  module_key: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_view_details: boolean;
  can_manage_permissions: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private http = inject(HttpClient);
  private apiUrl = environment.baseUrl + '/api/roles';
  private modulesUrl = environment.baseUrl + '/api/modules';

  getRoles(search?: string): Observable<Role[]> {
    let params: Record<string, string> = {};
    if (search) {
      params['search'] = search;
    }
    return this.http.get<Role[]>(this.apiUrl, { params });
  }

  getActiveRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/active`);
  }

  createRole(role: Partial<Role>): Observable<{ id: number, role_id: string, message: string }> {
    return this.http.post<{ id: number, role_id: string, message: string }>(this.apiUrl, role);
  }

  updateRole(id: number, role: Partial<Role>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, role);
  }

  deleteRole(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  toggleRoleStatus(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  getRolePermissions(roleId: number | string): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(`${this.apiUrl}/${roleId}/permissions`);
  }

  saveRolePermissions(roleId: number, permissions: Partial<RolePermission>[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${roleId}/permissions`, { permissions });
  }

  getModules(): Observable<ModuleItem[]> {
    return this.http.get<ModuleItem[]>(this.modulesUrl);
  }
}
