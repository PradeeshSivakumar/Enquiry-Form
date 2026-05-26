import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeadCategory, LeadCategoryService } from '../../services/lead-category.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PRODUCT_MASTER_ROLES } from '../../../../auth/guards/role.guard';
import { PaginationComponent } from '../../../../shared/pagination/pagination.component';
import { PermissionService } from '../../../../core/permissions/permission.service';

@Component({
  selector: 'app-lead-category-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './lead-category-page.component.html',
  styleUrl: './lead-category-page.component.css',
})
export class LeadCategoryPageComponent implements OnInit {
  private leadCategoryService = inject(LeadCategoryService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);

  get canAdd() { return this.permissionService.canAdd('lead_categories'); }
  get canEdit() { return this.permissionService.canEdit('lead_categories'); }
  get canDelete() { return this.permissionService.canDelete('lead_categories'); }

  categories = signal<LeadCategory[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  sortKey = signal<string>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');
  toastMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  isModalOpen = signal<boolean>(false);
  editingCategory = signal<LeadCategory | null>(null);
  categoryToDelete = signal<LeadCategory | null>(null);
  isSubmitting = signal<boolean>(false);
  canManageCategories = computed(() => this.authService.hasRole(PRODUCT_MASTER_ROLES));

  private toastTimeout: any;
  form!: FormGroup;

  filteredCategories = computed(() => this.categories());
  sortedCategories = computed(() => this.sortRows(this.filteredCategories(), this.getCategorySortValue.bind(this)));
  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedCategories().length / this.pageSize())));

  paginatedCategories = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedCategories().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.initForm();
    this.fetchCategories();
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', Validators.maxLength(500)]
    });
  }

  fetchCategories(): void {
    this.loading.set(true);
    this.error.set(null);

    this.leadCategoryService.getLeadCategories(this.searchQuery()).subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
        if (this.currentPage() > this.totalPages()) {
          this.currentPage.set(this.totalPages());
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load lead categories.');
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
    this.fetchCategories();
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
    this.editingCategory.set(null);
    this.form.reset({ name: '', description: '' });
    this.isModalOpen.set(true);
  }

  openEditModal(category: LeadCategory): void {
    this.editingCategory.set(category);
    this.form.patchValue({
      name: category.name,
      description: category.description || ''
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingCategory.set(null);
    this.isSubmitting.set(false);
  }

  openDeleteConfirmation(category: LeadCategory): void {
    this.categoryToDelete.set(category);
  }

  deleteCategory(): void {
    const category = this.categoryToDelete();
    if (!category?.id) {
      return;
    }

    this.leadCategoryService.deleteLeadCategory(category.id).subscribe({
      next: () => {
        this.categoryToDelete.set(null);
        this.showToast('Lead category deleted successfully', 'success');
        this.fetchCategories();
      },
      error: (err) => {
        this.categoryToDelete.set(null);
        this.showToast(err.error?.message || 'Failed to delete lead category', 'error');
      }
    });
  }

  saveCategory(): void {
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
    const editing = this.editingCategory();

    const request = editing?.id
      ? this.leadCategoryService.updateLeadCategory(editing.id, payload)
      : this.leadCategoryService.createLeadCategory(payload);

    request.subscribe({
      next: () => {
        this.showToast(editing?.id ? 'Lead category updated successfully' : 'Lead category added successfully', 'success');
        this.closeModal();
        this.fetchCategories();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Failed to save lead category', 'error');
        this.isSubmitting.set(false);
      }
    });
  }

  hasError(controlName: 'name' | 'description'): boolean {
    const control = this.form.get(controlName);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  trackByCategoryId(index: number, category: LeadCategory): number {
    return category.id;
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

  private getCategorySortValue(category: LeadCategory): string {
    switch (this.sortKey()) {
      case 'name':
        return category.name || '';
      case 'description':
        return category.description || '';
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
