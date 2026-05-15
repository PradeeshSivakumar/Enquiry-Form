import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  template: `
    <div
      class="group flex h-[260px] w-[200px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[#cccccc] bg-slate-50 text-center transition hover:border-[#1f1f1f]"
      (drop)="handleDrop($event)"
      (dragover)="handleDragOver($event)"
      (click)="openFilePicker()"
      tabindex="0"
      role="button"
      aria-label="Upload visiting card"
      (keydown.enter)="openFilePicker()"
      (keydown.space)="openFilePicker()"
    >
      @if (previewUrl) {
        <img
          [src]="previewUrl"
          alt="Visiting card preview"
          class="h-full w-full object-contain"
        />
      } @else {
        <div class="p-4 text-sm text-slate-600">
          <p class="font-medium text-[#1a2744]">Upload Visiting Card</p>
          <p class="mt-1 text-xs">
            Tap to open Camera or Gallery
          </p>
        </div>
      }

      <!-- Default Mobile Popup (Camera / Gallery chooser) -->
      <input
        #fileInput
        type="file"
        accept="image/*"
        class="hidden"
        (change)="onSelect($event)"
      />
    </div>
  `,
})
export class ImageUploadComponent {
  @Input() previewUrl: string | null = null;
  @Output() fileSelected = new EventEmitter<File>();

  openFilePicker(fileInput?: HTMLInputElement): void {
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    input?.click();
  }

  onSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      this.fileSelected.emit(file);
    }
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