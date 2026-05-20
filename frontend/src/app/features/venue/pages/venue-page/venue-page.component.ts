import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Venue, VenueService } from '../../services/venue.service';

@Component({
  selector: 'app-venue-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './venue-page.component.html',
  styleUrl: './venue-page.component.css',
})
export class VenuePageComponent implements OnInit {
  private venueService = inject(VenueService);
  private fb = inject(FormBuilder);

  venues = signal<Venue[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  searchQuery = signal<string>('');

  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  sortKey = signal<string>('venue');
  sortDirection = signal<'asc' | 'desc'>('asc');

  toastMessage = signal<{ text: string, type: 'success' | 'error' } | null>(null);
  private toastTimeout: any;

  isModalOpen = signal<boolean>(false);
  editingVenue = signal<Venue | null>(null);
  venueToDelete = signal<Venue | null>(null);
  isSubmitting = signal<boolean>(false);

  form!: FormGroup;

  filteredVenues = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    let result = this.venues();

    if (query) {
      result = result.filter(ven =>
        (ven.venue_id && ven.venue_id.toLowerCase().includes(query)) ||
        ven.venue.toLowerCase().includes(query) ||
        (ven.booth_number && ven.booth_number.toLowerCase().includes(query)) ||
        (ven.venue_date && this.formatDate(ven.venue_date).toLowerCase().includes(query))
      );
    }
    return result;
  });

  sortedVenues = computed(() => this.sortRows(this.filteredVenues(), this.getVenueSortValue.bind(this)));

  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedVenues().length / this.pageSize())));

  paginatedVenues = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.sortedVenues().slice(start, end);
  });

  ngOnInit(): void {
    this.initForm();
    this.fetchVenues();
  }

  initForm(): void {
    this.form = this.fb.group({
      venuePart: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\s&().,]+$/)]],
      cityPart: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s.]+$/)]],
      yearPart: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/), this.yearValidator]],
      boothNumber: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\s./-]+$/)]],
      venueDate: ['', [Validators.required, this.dateValidator]]
    });
  }

  onVenueInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value
      .replace(/[^a-zA-Z0-9\s&().,]/g, '')
      .replace(/\s{2,}/g, ' ')
      .slice(0, 80);
    this.form.get('venuePart')?.setValue(input.value, { emitEvent: false });
  }

  onCityInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value
      .replace(/[^a-zA-Z\s.]/g, '')
      .replace(/\s{2,}/g, ' ')
      .slice(0, 50);
    this.form.get('cityPart')?.setValue(input.value, { emitEvent: false });
  }

  onYearInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 4);
    this.form.get('yearPart')?.setValue(input.value, { emitEvent: false });
  }

  onBoothNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value
      .replace(/[^a-zA-Z0-9\s./-]/g, '')
      .replace(/\s{2,}/g, ' ')
      .slice(0, 30);
    this.form.get('boothNumber')?.setValue(input.value, { emitEvent: false });
  }

  fetchVenues(): void {
    this.loading.set(true);
    this.venueService.getVenues().subscribe({
      next: (data) => {
        this.venues.set(this.uniqueVenues(data));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load venues. ' + (err.message || ''));
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
    this.editingVenue.set(null);
    this.form.reset();
    this.isModalOpen.set(true);
  }

  openEditModal(ven: Venue): void {
    this.editingVenue.set(ven);
    const parts = ven.venue.split('-');
    let venuePart = parts[0] || '';
    let cityPart = parts[1] || '';
    let yearPart = parts[2] || '';
    
    if (parts.length > 3) {
      yearPart = parts[parts.length - 1];
      cityPart = parts[parts.length - 2];
      venuePart = parts.slice(0, parts.length - 2).join('-');
    }

    this.form.patchValue({
      venuePart,
      cityPart,
      yearPart,
      boothNumber: ven.booth_number || '',
      venueDate: this.toDateInputValue(ven.venue_date)
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingVenue.set(null);
  }

  openDeleteConfirmation(ven: Venue): void {
    this.venueToDelete.set(ven);
  }

  deleteVenue(): void {
    const ven = this.venueToDelete();
    if (!ven || !ven.id) return;

    this.venueService.deleteVenue(ven.id).subscribe({
      next: () => {
        this.showToast('Venue deleted successfully', 'success');
        this.venueToDelete.set(null);
        this.fetchVenues();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Failed to delete venue', 'error');
        this.venueToDelete.set(null);
      }
    });
  }

  saveVenue(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const vals = this.form.value;
    const combinedVenue = this.buildVenueName(vals.venuePart, vals.cityPart, vals.yearPart);
    const venueData = {
      venue: combinedVenue,
      booth_number: String(vals.boothNumber || '').trim().replace(/\s+/g, ' '),
      venue_date: vals.venueDate
    };
    const editing = this.editingVenue();

    if (this.hasDuplicateVenue(combinedVenue, editing?.id)) {
      this.showToast('Venue already exists', 'error');
      this.isSubmitting.set(false);
      return;
    }

    if (editing && editing.id) {
      this.venueService.updateVenue(editing.id, venueData).subscribe({
        next: () => {
          this.showToast('Venue updated successfully', 'success');
          this.closeModal();
          this.fetchVenues();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to update venue', 'error');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.venueService.addVenue(venueData).subscribe({
        next: () => {
          this.showToast('Venue added successfully', 'success');
          this.closeModal();
          this.fetchVenues();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Failed to add venue', 'error');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  yearErrorMessage(): string {
    const control = this.form.get('yearPart');
    if (control?.hasError('required')) return 'Year is required';
    if (control?.hasError('pattern')) return 'Enter a valid 4-digit year';
    if (control?.hasError('yearRange')) return 'Year must be between 1900 and 2099';
    return 'Invalid year';
  }

  dateErrorMessage(): string {
    const control = this.form.get('venueDate');
    if (control?.hasError('required')) return 'Date is required';
    if (control?.hasError('dateInvalid')) return 'Enter a valid date';
    return 'Invalid date';
  }

  boothErrorMessage(): string {
    const control = this.form.get('boothNumber');
    if (control?.hasError('required')) return 'Booth number is required';
    if (control?.hasError('pattern')) return 'Use letters, numbers, spaces, slash, dash, and periods only';
    return 'Invalid booth number';
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

  getVenueParts(venue: string): { venueName: string, city: string, year: string } {
    if (!venue) return { venueName: '-', city: '-', year: '-' };
    const parts = venue.split('-');
    if (parts.length >= 3) {
      const year = parts[parts.length - 1];
      const city = parts[parts.length - 2];
      const venueName = parts.slice(0, parts.length - 2).join('-');
      return { venueName, city, year };
    }
    return { venueName: venue, city: '-', year: '-' };
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private buildVenueName(venuePart: string, cityPart: string, yearPart: string): string {
    return [venuePart, cityPart, yearPart]
      .map(part => String(part || '').trim().replace(/\s+/g, ' '))
      .join('-');
  }

  private normalizeVenue(venue: string): string {
    return String(venue || '')
      .split('-')
      .map(part => part.trim().replace(/\s+/g, ' '))
      .join('-')
      .toLowerCase();
  }

  private uniqueVenues(venues: Venue[]): Venue[] {
    const seen = new Set<string>();
    return venues.filter(venue => {
      const key = this.normalizeVenue(venue.venue);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private hasDuplicateVenue(venue: string, editingId?: number): boolean {
    const normalizedVenue = this.normalizeVenue(venue);
    return this.venues().some(existing =>
      existing.id !== editingId && this.normalizeVenue(existing.venue) === normalizedVenue
    );
  }

  private yearValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value || '').trim();
    if (!/^[0-9]{4}$/.test(value)) {
      return null;
    }

    const year = Number(value);
    return year >= 1900 && year <= 2099 ? null : { yearRange: true };
  }

  private dateValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value || '').trim();
    if (!value) return null;

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return { dateInvalid: true };
    }

    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? null
      : { dateInvalid: true };
  }

  private toDateInputValue(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toISOString().slice(0, 10);
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

  private getVenueSortValue(venue: Venue): string | number {
    const parts = this.getVenueParts(venue.venue);
    switch (this.sortKey()) {
      case 'venue':
        return parts.venueName;
      case 'city':
        return parts.city;
      case 'year':
        return Number(parts.year) || parts.year;
      case 'booth':
        return venue.booth_number || '';
      case 'date':
        return venue.venue_date || '';
      default:
        return '';
    }
  }
}
