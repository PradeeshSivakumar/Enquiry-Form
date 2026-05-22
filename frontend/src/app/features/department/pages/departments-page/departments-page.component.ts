import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Department, DepartmentService } from '../../services/department.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PRODUCT_MASTER_ROLES } from '../../../../auth/guards/role.guard';

@Component({
  selector: 'app-departments-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './departments-page.component.html',
  styleUrl: './departments-page.component.css',
})
export class DepartmentsPageComponent implements OnInit {
  private departmentService = inject(DepartmentService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  departments = signal<Department[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  sortKey = signal<string>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');
  toastMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  isModalOpen = signal<boolean>(false);
  editingDepartment = signal<Department | null>(null);
  departmentToDelete = signal<Department | null>(null);
  isSubmitting = signal<boolean>(false);
  canManageDepartments = computed(() => this.authService.hasRole(PRODUCT_MASTER_ROLES));

  private toastTimeout: any;
  form!: FormGroup;

  filteredDepartments = computed(() => this.departments());
  sortedDepartments = computed(() => this.sortRows(this.filteredDepartments(), this.getDepartmentSortValue.bind(this)));
  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedDepartments().length / this.pageSize())));

  paginatedDepartments = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedDepartments().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.initForm();
    this.fetchDepartments();
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', Validators.maxLength(500)]
    });
  }

  fetchDepartments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.departmentService.getDepartments(this.searchQuery()).subscribe({
      next: (data) => {
        this.departments.set(data);
        this.loading.set(false);
        if (this.currentPage() > this.totalPages()) {
          this.currentPage.set(this.totalPages());
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load departments.');
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
    this.fetchDepartments();
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(Number(target.value));
    this.currentPage.set(1);
  }

  sortBy(key: string): void {
    if (this.sortKey() === key) {
      this.sortDirection.update(direction => direction === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  sortIndicator(key: string): string {
    if (this.sortKey() !== key) {
      return '↕';
    }
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
    }
  }

  openAddModal(): void {
    this.editingDepartment.set(null);
    this.form.reset({ name: '', description: '' });
    this.isModalOpen.set(true);
  }

  openEditModal(department: Department): void {
    this.editingDepartment.set(department);
    this.form.patchValue({
      name: department.name,
      description: department.description || ''
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingDepartment.set(null);
    this.isSubmitting.set(false);
  }

  openDeleteConfirmation(department: Department): void {
    this.departmentToDelete.set(department);
  }

  deleteDepartment(): void {
    const department = this.departmentToDelete();
    if (!department?.id) {
      return;
    }

    this.departmentService.deleteDepartment(department.id).subscribe({
      next: () => {
        this.departmentToDelete.set(null);
        this.showToast('Department deleted successfully', 'success');
        this.fetchDepartments();
      },
      error: (err) => {
        this.departmentToDelete.set(null);
        this.showToast(err.error?.message || 'Failed to delete department', 'error');
      }
    });
  }

  saveDepartment(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const payload = {
      name: value.name.trim(),
      description: value.description?.trim() || null
    };

    this.isSubmitting.set(true);
    const editing = this.editingDepartment();

    const request = editing?.id
      ? this.departmentService.updateDepartment(editing.id, payload)
      : this.departmentService.createDepartment(payload);

    request.subscribe({
      next: () => {
        this.showToast(editing?.id ? 'Department updated successfully' : 'Department added successfully', 'success');
        this.closeModal();
        this.fetchDepartments();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Failed to save department', 'error');
        this.isSubmitting.set(false);
      }
    });
  }

  hasError(controlName: 'name' | 'description'): boolean {
    const control = this.form.get(controlName);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  trackByDepartmentId(index: number, department: Department): number {
    return department.id;
  }

  private sortRows<T>(rows: T[], valueGetter: (row: T, index: number) => string | number): T[] {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const indexed = rows.map((row, index) => ({ row, index }));

    indexed.sort((a, b) => {
      const aValue = key === 'serial' ? a.index : valueGetter(a.row, a.index);
      const bValue = key === 'serial' ? b.index : valueGetter(b.row, b.index);
      const comparison = typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue || '').localeCompare(String(bValue || ''), undefined, { numeric: true, sensitivity: 'base' });

      return direction === 'asc' ? comparison : -comparison;
    });

    return indexed.map(item => item.row);
  }

  private getDepartmentSortValue(department: Department): string {
    switch (this.sortKey()) {
      case 'name':
        return department.name || '';
      case 'description':
        return department.description || '';
      default:
        return '';
    }
  }

  private showToast(text: string, type: 'success' | 'error'): void {
    this.toastMessage.set({ text, type });
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
