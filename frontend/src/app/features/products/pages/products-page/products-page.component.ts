import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product, ProductsService } from '../../services/products.service';

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

  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');
  statusFilter = signal<string>('all');
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  toastMessage = signal<{ text: string, type: 'success' | 'error' } | null>(null);
  isModalOpen = signal<boolean>(false);
  editingProduct = signal<Product | null>(null);
  productToDelete = signal<Product | null>(null);
  isSubmitting = signal<boolean>(false);

  private toastTimeout: any;
  form!: FormGroup;

  filteredProducts = computed(() => this.products());
  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize())));
  activeCount = computed(() => this.products().filter(product => product.status === 1).length);
  inactiveCount = computed(() => this.products().filter(product => product.status === 0).length);

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredProducts().slice(start, start + this.pageSize());
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
      status: [1, Validators.required],
    });
  }

  fetchProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productsService.getProducts(this.searchQuery(), this.statusFilter()).subscribe({
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

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value);
    this.currentPage.set(1);
    this.fetchProducts();
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(Number(target.value));
    this.currentPage.set(1);
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
    this.form.reset({ name: '', category: '', description: '', status: 1 });
    this.isModalOpen.set(true);
  }

  openEditModal(product: Product): void {
    this.editingProduct.set(product);
    this.form.patchValue({
      name: product.name,
      category: product.category || '',
      description: product.description || '',
      status: product.status,
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
      status: Number(value.status),
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

  toggleProductStatus(product: Product): void {
    if (!product.id) {
      return;
    }

    const nextStatus = product.status === 1 ? 0 : 1;
    this.productsService.updateProduct(product.id, {
      name: product.name,
      category: product.category || null,
      description: product.description || null,
      status: nextStatus,
    }).subscribe({
      next: () => {
        this.showToast(nextStatus === 1 ? 'Product activated' : 'Product deactivated', 'success');
        this.fetchProducts();
      },
      error: (err) => this.showToast(err.error?.message || 'Failed to update status', 'error')
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  private showToast(text: string, type: 'success' | 'error'): void {
    this.toastMessage.set({ text, type });
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
