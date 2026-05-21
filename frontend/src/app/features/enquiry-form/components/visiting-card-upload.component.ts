import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-visiting-card-upload',
  standalone: true,
  template: `
    <div
      class="relative flex min-h-[260px] w-full flex-col overflow-hidden rounded-2xl border-2 border-dashed border-[#d1d5db] bg-slate-50 transition duration-300 hover:border-[#1f1f1f] hover:shadow-[0_0_0_4px_rgba(31,31,31,0.08)]"
      [class.border-[#1f1f1f]]="previewUrl"
      (drop)="handleDrop($event)"
      (dragover)="handleDragOver($event)"
    >
      @if (previewUrl) {
        <div class="relative flex flex-1 items-center justify-center p-4">
          <img [src]="previewUrl" [alt]="title + ' preview'" class="max-h-[220px] w-full rounded-xl object-contain" />
          @if (scanning) {
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-[1px]">
              <div class="h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-gray-700">Scanning...</span>
            </div>
          }
          <button
            type="button"
            class="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow"
            (click)="clearPreview($event)"
          >
            Remove
          </button>
        </div>
      } @else {
        <div class="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-[#1f1f1f]">
            <svg viewBox="0 0 24 24" class="h-6 w-6 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
              <rect x="4" y="5" width="16" height="14" rx="2" />
              <path d="M8 13l2.5-2.5L14 14l1.5-1.5L20 17" />
              <circle cx="15.5" cy="9.5" r="1.4" />
            </svg>
          </div>
          <p class="mt-4 text-base font-semibold text-[#1f1f1f]">{{ title }}</p>
          <p class="mt-1 text-sm text-slate-500">Drag & drop, upload, or take a photo</p>
          <p class="mt-2 text-xs text-slate-400">PNG, JPG · Max 5MB</p>
          <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              class="rounded-xl border border-[#d1d5db] bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-[#1f1f1f] hover:bg-slate-50"
              (click)="openGallery($event)"
            >
              Upload image
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
              (click)="openCamera($event)"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h2l1-1h8l1 1h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              Take photo
            </button>
          </div>
        </div>
      }

      <input
        #galleryInput
        type="file"
        class="sr-only"
        accept="image/png,image/jpeg,image/jpg"
        (change)="onFileChange($event)"
      />
      <input
        #cameraInput
        type="file"
        class="sr-only"
        accept="image/*"
        capture="environment"
        (change)="onFileChange($event)"
      />
    </div>
  `,
})
export class VisitingCardUploadComponent {
  @Input() title = 'Visiting Card';
  @Input() previewUrl: string | null = null;
  @Input() scanning = false;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() removed = new EventEmitter<void>();

  @ViewChild('galleryInput') galleryInput?: ElementRef<HTMLInputElement>;
  @ViewChild('cameraInput') cameraInput?: ElementRef<HTMLInputElement>;

  openGallery(event: Event): void {
    event.stopPropagation();
    this.galleryInput?.nativeElement.click();
  }

  openCamera(event: Event): void {
    event.stopPropagation();
    this.cameraInput?.nativeElement.click();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file && this.isValidImage(file)) {
      this.fileSelected.emit(file);
    }
  }

  clearPreview(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.resetInputs();
    this.removed.emit();
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file && this.isValidImage(file)) {
      this.fileSelected.emit(file);
    }
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private isValidImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private resetInputs(): void {
    if (this.galleryInput?.nativeElement) {
      this.galleryInput.nativeElement.value = '';
    }
    if (this.cameraInput?.nativeElement) {
      this.cameraInput.nativeElement.value = '';
    }
  }
}
