import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolesService, Role, RolePermission } from '../../services/roles.service';
import { PaginationComponent } from '../../../../shared/pagination/pagination.component';
import { PermissionService } from '../../../../core/permissions/permission.service';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './roles-page.component.html',
  styleUrl: './roles-page.component.css'
})
export class RolesPageComponent implements OnInit {
  private rolesService = inject(RolesService);
  private fb = inject(FormBuilder);
  private permissionService = inject(PermissionService);

  get canAdd() { return this.permissionService.canAdd('roles'); }
  get canEdit() { return this.permissionService.canEdit('roles'); }
  get canDelete() { return this.permissionService.canDelete('roles'); }
  get canManagePerms() { return this.permissionService.canManagePermissions('roles'); }

  roles = signal<Role[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  searchQuery = signal<string>('');
  
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  sortKey = signal<string>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  toastMessage = signal<{text: string, type: 'success' | 'error'} | null>(null);
  private toastTimeout: any;

  isModalOpen = signal<boolean>(false);
  isPermissionModalOpen = signal<boolean>(false);
  editingRole = signal<Role | null>(null);
  roleToToggle = signal<Role | null>(null);
  roleToDelete = signal<Role | null>(null);
  isStatusChangeOpen = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  permissions = signal<RolePermission[]>([]);
  savingPermissions = signal<boolean>(false);

  Math = Math;

  form!: FormGroup;

  filteredRoles = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    let result = this.roles();

    if (query) {
      result = result.filter(r => 
        r.name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query)) ||
        (r.role_id && r.role_id.toLowerCase().includes(query))
      );
    }
    return result;
  });

  sortedRoles = computed(() => this.sortRows(this.filteredRoles()));
  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedRoles().length / this.pageSize())));
  paginatedRoles = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedRoles().slice(start, start + this.pageSize());
  });

  ngOnInit() {
    this.initForm();
    this.fetchRoles();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  fetchRoles() {
    this.loading.set(true);
    this.rolesService.getRoles(this.searchQuery()).subscribe({
      next: (data) => {
        this.roles.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load roles. ' + (err.message || ''));
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
    this.fetchRoles();
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(Number(target.value));
    this.currentPage.set(1);
  }

  sortBy(key: string) {
    if (this.sortKey() === key) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  sortIndicator(key: string): string {
    if (this.sortKey() !== key) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }

  openAddModal() {
    this.editingRole.set(null);
    this.form.reset();
    this.isModalOpen.set(true);
  }

  openEditModal(role: Role) {
    this.editingRole.set(role);
    this.form.patchValue({
      name: role.name,
      description: role.description
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingRole.set(null);
  }

  saveRole() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const data = this.form.value;
    const editing = this.editingRole();

    if (editing && editing.id) {
      this.rolesService.updateRole(editing.id, data).subscribe({
        next: () => {
          this.showToast('Role updated successfully', 'success');
          this.closeModal();
          this.fetchRoles();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to update role', 'error');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.rolesService.createRole(data).subscribe({
        next: () => {
          this.showToast('Role created successfully', 'success');
          this.closeModal();
          this.fetchRoles();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to create role', 'error');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  openDeleteConfirmation(role: Role) {
    this.roleToDelete.set(role);
  }

  deleteRole() {
    const role = this.roleToDelete();
    if (!role || !role.id) return;

    this.rolesService.deleteRole(role.id).subscribe({
      next: () => {
        this.showToast('Role deleted successfully', 'success');
        this.roleToDelete.set(null);
        this.fetchRoles();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Failed to delete role', 'error');
        this.roleToDelete.set(null);
      }
    });
  }

  toggleStatus(role: Role) {
    if (!role.id) return;
    this.roleToToggle.set(role);
    this.isStatusChangeOpen.set(true);
  }

  // Confirm status change from modal
  confirmStatusChange() {
    const role = this.roleToToggle();
    if (!role || !role.id) return;
    this.rolesService.toggleRoleStatus(role.id).subscribe({
      next: () => {
        this.showToast('Role status updated', 'success');
        this.fetchRoles();
        this.isStatusChangeOpen.set(false);
        this.roleToToggle.set(null);
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Failed to update status', 'error');
      }
    });
  }

  // Close status confirmation modal
  closeStatusModal() {
    this.isStatusChangeOpen.set(false);
    this.roleToToggle.set(null);
  }

  openPermissionsModal(role: Role) {
    if (!role.id) return;
    this.editingRole.set(role);
    this.loading.set(true);
    this.rolesService.getRolePermissions(role.id).subscribe({
      next: (perms) => {
        this.permissions.set(perms);
        this.isPermissionModalOpen.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.showToast('Failed to load permissions', 'error');
        this.loading.set(false);
      }
    });
  }

  closePermissionsModal() {
    this.isPermissionModalOpen.set(false);
    this.editingRole.set(null);
    this.permissions.set([]);
  }

  getModuleCapabilities(moduleKey: string) {
    switch (moduleKey) {
      case 'dashboard':
        return { view: true, add: false, edit: false, delete: false, export: false, details: false, manage: false };
      case 'visitors_directory':
        return { view: true, add: true, edit: true, delete: true, export: true, details: true, manage: false };
      case 'employees':
        return { view: true, add: true, edit: true, delete: true, export: true, details: false, manage: false };
      case 'departments':
      case 'venues':
      case 'lead_categories':
        return { view: true, add: true, edit: true, delete: true, export: false, details: false, manage: false };
      case 'products':
        return { view: true, add: true, edit: true, delete: true, export: true, details: false, manage: false };
      case 'roles':
        return { view: true, add: true, edit: true, delete: true, export: false, details: false, manage: true };
      case 'email_campaigns':
        return { view: true, add: true, edit: true, delete: false, export: true, details: false, manage: false };
      default:
        return { view: true, add: true, edit: true, delete: true, export: true, details: true, manage: true };
    }
  }

  togglePermission(index: number, field: keyof RolePermission) {
    const perms = [...this.permissions()];
    if (typeof perms[index][field] === 'boolean') {
      (perms[index][field] as unknown as boolean) = !(perms[index][field] as unknown as boolean);
      this.permissions.set(perms);
    }
  }

  savePermissions() {
    const role = this.editingRole();
    if (!role || !role.id) return;

    this.savingPermissions.set(true);
    this.rolesService.saveRolePermissions(role.id, this.permissions()).subscribe({
      next: () => {
        this.showToast('Permissions saved successfully', 'success');
        this.closePermissionsModal();
        this.savingPermissions.set(false);
      },
      error: () => {
        this.showToast('Failed to save permissions', 'error');
        this.savingPermissions.set(false);
      }
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  getStatusLabel(status: number | undefined): string {
    return Number(status) === 0 ? 'Inactive' : 'Active';
  }

  private sortRows(rows: Role[]): Role[] {
    const key = this.sortKey() as keyof Role;
    const direction = this.sortDirection();

    return [...rows].sort((a, b) => {
      let aVal = a[key] || '';
      let bVal = b[key] || '';

      if (key === 'is_active') {
        aVal = this.getStatusLabel(a.is_active);
        bVal = this.getStatusLabel(b.is_active);
      }

      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  private showToast(text: string, type: 'success' | 'error') {
    this.toastMessage.set({ text, type });
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
