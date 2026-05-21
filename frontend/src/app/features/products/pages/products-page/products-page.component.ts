import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product, ProductsService } from '../../services/products.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PRODUCT_MASTER_ROLES } from '../../../../auth/guards/role.guard';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.css',
})
export class ProductsPageComponent implements OnInit {
  private productsService = inject(ProductsService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  sortKey = signal<string>('product');
  sortDirection = signal<'asc' | 'desc'>('asc');
  toastMessage = signal<{ text: string, type: 'success' | 'error' } | null>(null);
  isModalOpen = signal<boolean>(false);
  editingProduct = signal<Product | null>(null);
  productToDelete = signal<Product | null>(null);
  isSubmitting = signal<boolean>(false);
  canManageProducts = computed(() => this.authService.hasRole(PRODUCT_MASTER_ROLES));

  private toastTimeout: any;
  form!: FormGroup;

  filteredProducts = computed(() => this.products());
  sortedProducts = computed(() => this.sortRows(this.filteredProducts(), this.getProductSortValue.bind(this)));
  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedProducts().length / this.pageSize())));

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedProducts().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.initForm();
    this.fetchProducts();
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      category: ['', Validators.maxLength(100)],
      description: ['', Validators.maxLength(500)],
    });
  }

  fetchProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productsService.getProducts(this.searchQuery()).subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
        if (this.currentPage() > this.totalPages()) {
          this.currentPage.set(this.totalPages());
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load products.');
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
    this.fetchProducts();
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
    this.editingProduct.set(null);
    this.form.reset({ name: '', category: '', description: '' });
    this.isModalOpen.set(true);
  }

  openEditModal(product: Product): void {
    this.editingProduct.set(product);
    this.form.patchValue({
      name: product.name,
      category: product.category || '',
      description: product.description || '',
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingProduct.set(null);
    this.isSubmitting.set(false);
  }

  openDeleteConfirmation(product: Product): void {
    this.productToDelete.set(product);
  }

  deleteProduct(): void {
    const product = this.productToDelete();
    if (!product?.id) {
      return;
    }

    this.productsService.deleteProduct(product.id).subscribe({
      next: () => {
        this.productToDelete.set(null);
        this.showToast('Product deleted successfully', 'success');
        this.fetchProducts();
      },
      error: (err) => {
        this.productToDelete.set(null);
        this.showToast(err.error?.message || 'Failed to delete product', 'error');
      }
    });
  }

  saveProduct(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const payload = {
      name: value.name.trim(),
      category: value.category?.trim() || null,
      description: value.description?.trim() || null,
    };

    this.isSubmitting.set(true);
    const editing = this.editingProduct();

    if (editing?.id) {
      this.productsService.updateProduct(editing.id, payload).subscribe({
        next: () => {
          this.showToast('Product updated successfully', 'success');
          this.closeModal();
          this.fetchProducts();
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to update product', 'error');
          this.isSubmitting.set(false);
        }
      });
      return;
    }

    this.productsService.addProduct(payload).subscribe({
      next: () => {
        this.showToast('Product added successfully', 'success');
        this.closeModal();
        this.fetchProducts();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Failed to add product', 'error');
        this.isSubmitting.set(false);
      }
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control?.invalid && (control.touched || control.dirty));
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

  private getProductSortValue(product: Product): string {
    switch (this.sortKey()) {
      case 'product':
        return product.name || '';
      case 'category':
        return product.category || '';
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
