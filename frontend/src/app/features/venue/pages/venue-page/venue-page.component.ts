import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
        ven.venue.toLowerCase().includes(query)
      );
    }
    return result;
  });

  totalPages = computed(() => Math.ceil(this.filteredVenues().length / this.pageSize()));

  paginatedVenues = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredVenues().slice(start, end);
  });

  ngOnInit(): void {
    this.initForm();
    this.fetchVenues();
  }

  initForm(): void {
    this.form = this.fb.group({
      venuePart: ['', Validators.required],
      cityPart: ['', Validators.required],
      yearPart: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]]
    });
  }

  onYearInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 4);
    this.form.get('yearPart')?.setValue(input.value, { emitEvent: false });
  }

  fetchVenues(): void {
    this.loading.set(true);
    this.venueService.getVenues().subscribe({
      next: (data) => {
        this.venues.set(data);
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
      yearPart
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
    const combinedVenue = `${vals.venuePart.trim()}-${vals.cityPart.trim()}-${vals.yearPart.trim()}`;
    const venueData = { venue: combinedVenue };
    const editing = this.editingVenue();

    if (editing && editing.id) {
      this.venueService.updateVenue(editing.id, venueData).subscribe({
        next: () => {
          this.showToast('Venue updated successfully', 'success');
          this.closeModal();
          this.fetchVenues();
          this.isSubmitting.set(false);
        },
        error: () => {
          this.showToast('Failed to update venue', 'error');
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
        error: () => {
          this.showToast('Failed to add venue', 'error');
          this.isSubmitting.set(false);
        }
      });
    }
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
}
