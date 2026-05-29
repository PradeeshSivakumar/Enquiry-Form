import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent implements OnChanges {
  @Input() totalItems = 0;
  @Input() pageSize = 5;
  @Input() currentPage = 1;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  totalPages = 1;
  pages: (number | string)[] = [];
  previousPageSize = 5;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pageSize'] && this.pageSize < this.totalItems) {
      this.previousPageSize = this.pageSize;
    }
    this.calculateTotalPages();
    this.generatePages();
  }

  calculateTotalPages(): void {
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  generatePages(): void {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (current <= 4) {
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push('...');
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
      }
    }
    this.pages = pages;
  }

  selectPage(page: number | string): void {
    if (typeof page === 'number' && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  toggleShowAll(): void {
    if (this.pageSize >= this.totalItems) {
      // Toggle back to paginated view
      const restoreSize = this.previousPageSize || 5;
      this.pageSizeChange.emit(restoreSize);
    } else {
      // Show all
      this.previousPageSize = this.pageSize;
      this.pageSizeChange.emit(this.totalItems || 999999);
    }
  }

  get isShowAllActive(): boolean {
    return this.pageSize >= this.totalItems;
  }

  get startRange(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRange(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.totalItems ? this.totalItems : end;
  }
}
