import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee, EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employee-page.component.html',
  styleUrl: './employee-page.component.css',
})
export class EmployeePageComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private fb = inject(FormBuilder);

  employees = signal<Employee[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  searchQuery = signal<string>('');
  
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  
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
    let result = this.employees();
    
    if (query) {
      result = result.filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.mobile_number.includes(query) ||
        emp.role.toLowerCase().includes(query)
      );
    }
    return result;
  });

  totalPages = computed(() => Math.ceil(this.filteredEmployees().length / this.pageSize()));

  paginatedEmployees = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredEmployees().slice(start, end);
  });

  ngOnInit(): void {
    this.initForm();
    this.fetchEmployees();
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[a-zA-Z\\s]*$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      mobile_number: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      role: ['', Validators.required]
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

    const headers = ['Name', 'Email', 'Mobile Number', 'Role'];
    const csvContent = [
      headers.join(','),
      ...data.map(emp => [
        `"${emp.name}"`,
        `"${emp.email}"`,
        `"${emp.mobile_number}"`,
        `"${emp.role}"`
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

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(Number(target.value));
    this.currentPage.set(1);
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
    this.form.reset({ role: '' });
    this.form.get('password')?.setValidators([Validators.required]);
    this.form.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  openEditModal(emp: Employee): void {
    this.editingEmployee.set(emp);
    this.form.get('password')?.setValidators([Validators.required]);
    this.form.get('password')?.updateValueAndValidity();
    this.form.patchValue({
      name: emp.name,
      email: emp.email,
      password: emp.password,
      mobile_number: emp.mobile_number,
      role: emp.role
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
    const employeeData = this.form.value;
    const editing = this.editingEmployee();

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

  private showToast(text: string, type: 'success' | 'error'): void {
    this.toastMessage.set({ text, type });
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
