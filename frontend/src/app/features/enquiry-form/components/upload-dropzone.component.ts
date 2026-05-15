import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-upload-dropzone',
  standalone: true,
  template: `
    <label
      class="group relative flex min-h-[260px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#d1d5db] bg-slate-50 p-5 text-center transition duration-300 hover:border-[#1f1f1f] hover:shadow-[0_0_0_4px_rgba(31,31,31,0.08)]"
      (drop)="handleDrop($event)"
      (dragover)="handleDragOver($event)"
      tabindex="0"
      role="button"
      aria-label="Upload visiting card"
      for="visiting-card-upload"
      (keydown.enter)="fileInput.click()"
      (keydown.space)="fileInput.click()"
    >
      @if (previewUrl) {
        <img [src]="previewUrl" alt="Visiting card preview" class="h-[240px] w-full rounded-xl object-contain transition duration-300" />
        <button
          type="button"
          class="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow"
          (click)="clearPreview($event)"
        >
          Remove
        </button>
      } @else {
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-[#1f1f1f]">
          <svg viewBox="0 0 24 24" class="h-6 w-6 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
            <rect x="4" y="5" width="16" height="14" rx="2" />
            <path d="M8 13l2.5-2.5L14 14l1.5-1.5L20 17" />
            <circle cx="15.5" cy="9.5" r="1.4" />
          </svg>
        </div>
        <p class="mt-4 text-base font-semibold text-[#1f1f1f]">Drag & Drop Visiting Card</p>
        <p class="mt-1 text-sm text-slate-500">or browse image files</p>
        <p class="mt-3 text-xs text-slate-400">PNG, JPG supported</p>
      }
      <input #fileInput id="visiting-card-upload" type="file" accept="image/*,.png,.jpg,.jpeg" class="sr-only" (change)="onSelect($event)" />
    </label>
  `,
})
export class UploadDropzoneComponent {
  @Input() previewUrl: string | null = null;
  @Output() fileSelected = new EventEmitter<File>();
  @Output() removed = new EventEmitter<void>();

  onSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.fileSelected.emit(file);
    }
  }

  clearPreview(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.removed.emit();
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.fileSelected.emit(file);
    }
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }
}
