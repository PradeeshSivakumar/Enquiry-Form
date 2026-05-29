import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee, EmployeeService } from '../../services/employee.service';
import { RolesService, Role } from '../../../roles/services/roles.service';
import { PermissionService } from '../../../../core/permissions/permission.service';
import { PaginationComponent } from '../../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-employee-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './employee-page.component.html',
  styleUrl: './employee-page.component.css',
})
export class EmployeePageComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private rolesService = inject(RolesService);
  private permissionService = inject(PermissionService);
  private fb = inject(FormBuilder);

  get canAdd() { return this.permissionService.canAdd('employees'); }
  get canEdit() { return this.permissionService.canEdit('employees'); }
  get canDelete() { return this.permissionService.canDelete('employees'); }
  get canExport() { return this.permissionService.canExport('employees'); }

  employees = signal<Employee[]>([]);
  activeRoles = signal<Role[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  searchQuery = signal<string>('');
  statusFilter = signal<string>('1');
  
  pageSize = signal<number>(5);
  currentPage = signal<number>(1);
  sortKey = signal<string>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');
  
  toastMessage = signal<{text: string, type: 'success' | 'error'} | null>(null);
  private toastTimeout: any;

  isModalOpen = signal<boolean>(false);
  editingEmployee = signal<Employee | null>(null);
  employeeToDelete = signal<Employee | null>(null);
  isSubmitting = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  
  form!: FormGroup;

  filteredEmployees = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    let result = this.employees();

    if (status !== 'all') {
      result = result.filter(emp => Number(emp.status) === Number(status));
    }
    
    if (query) {
      result = result.filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.mobile_number.includes(query) ||
        emp.role.toLowerCase().includes(query) ||
        this.getStatusLabel(emp.status).toLowerCase().includes(query)
      );
    }
    return result;
  });

  sortedEmployees = computed(() => this.sortRows(this.filteredEmployees(), this.getEmployeeSortValue.bind(this)));

  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedEmployees().length / this.pageSize())));

  paginatedEmployees = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.sortedEmployees().slice(start, end);
  });

  ngOnInit(): void {
    this.initForm();
    this.fetchRoles();
    this.fetchEmployees();
  }

  fetchRoles(): void {
    this.rolesService.getActiveRoles().subscribe({
      next: (roles) => this.activeRoles.set(roles),
      error: () => console.error('Failed to fetch active roles')
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[a-zA-Z\\s]*$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      mobile_number: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      role: ['', Validators.required],
      status: [1, Validators.required]
    });
  }

  onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
    this.form.get('name')?.setValue(input.value, { emitEvent: false });
  }

  onMobileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    this.form.get('mobile_number')?.setValue(input.value, { emitEvent: false });
  }

  downloadFilteredData(): void {
    const data = this.filteredEmployees();
    if (data.length === 0) return;

    const headers = ['Name', 'Email', 'Mobile Number', 'Role', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(emp => [
        `"${emp.name}"`,
        `"${emp.email}"`,
        `"${emp.mobile_number}"`,
        `"${emp.role}"`,
        `"${this.getStatusLabel(emp.status)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  fetchEmployees(): void {
    this.loading.set(true);
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load employees. ' + (err.message || ''));
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value);
    this.currentPage.set(1);
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
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  openAddModal(): void {
    this.editingEmployee.set(null);
    this.form.reset({ role: '', status: 1 });
    this.form.get('password')?.setValidators([Validators.required]);
    this.form.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  openEditModal(emp: Employee): void {
    this.editingEmployee.set(emp);
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.setValue('');
    this.form.get('password')?.updateValueAndValidity();
    this.form.patchValue({
      name: emp.name,
      email: emp.email,
      mobile_number: emp.mobile_number,
      role: emp.role,
      status: Number(emp.status) === 0 ? 0 : 1
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingEmployee.set(null);
    this.showPassword.set(false);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  openDeleteConfirmation(emp: Employee): void {
    this.employeeToDelete.set(emp);
  }

  deleteEmployee(): void {
    const emp = this.employeeToDelete();
    if (!emp || !emp.id) return;
    
    this.employeeService.deleteEmployee(emp.id).subscribe({
      next: () => {
        this.showToast('Employee deleted successfully', 'success');
        this.employeeToDelete.set(null);
        this.fetchEmployees();
      },
      error: () => {
        this.showToast('Failed to delete employee', 'error');
      }
    });
  }

  saveEmployee(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const editing = this.editingEmployee();
    const rawValue = this.form.value;
    const employeeData = editing
      ? {
          name: rawValue.name,
          email: rawValue.email,
          mobile_number: rawValue.mobile_number,
          role: rawValue.role,
          status: rawValue.status
        }
      : rawValue;

    if (editing && editing.id) {
      this.employeeService.updateEmployee(editing.id, employeeData).subscribe({
        next: () => {
          this.showToast('Employee updated successfully', 'success');
          this.closeModal();
          this.fetchEmployees();
          this.isSubmitting.set(false);
        },
        error: () => {
          this.showToast('Failed to update employee', 'error');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.employeeService.addEmployee(employeeData).subscribe({
        next: () => {
          this.showToast('Employee added successfully', 'success');
          this.closeModal();
          this.fetchEmployees();
          this.isSubmitting.set(false);
        },
        error: () => {
          this.showToast('Failed to add employee', 'error');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  maskPassword(password: string | undefined): string {
    if (!password) return '';
    return '•'.repeat(password.length > 8 ? 8 : password.length);
  }

  getStatusLabel(status: number | undefined): string {
    return Number(status) === 0 ? 'Inactive' : 'Active';
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

  private getEmployeeSortValue(employee: Employee): string | number {
    switch (this.sortKey()) {
      case 'name':
        return employee.name || '';
      case 'email':
        return employee.email || '';
      case 'mobile':
        return employee.mobile_number || '';
      case 'role':
        return employee.role || '';
      case 'status':
        return this.getStatusLabel(employee.status);
      default:
        return '';
    }
  }

  private showToast(text: string, type: 'success' | 'error'): void {
    this.toastMessage.set({ text, type });
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
  allowOnlyLetters(event: KeyboardEvent): void {
  const charCode = event.key;
  if (!/^[a-zA-Z ]$/.test(charCode)) {
    event.preventDefault();
  }
}

allowOnlyNumbers(event: KeyboardEvent): void {
  const charCode = event.key;
  if (!/[0-9]/.test(charCode)) {
    event.preventDefault();
  }
}
}
