import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../core/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="global-loader" *ngIf="isLoading | async">
      <div class="spinner"></div>
    </div>
  `,
  styles: [
    `
    .global-loader {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.6);
      z-index: 9999;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 6px solid #ccc;
      border-top-color: #1976d2;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    `,
  ],
})
export class LoaderComponent {
  isLoading = inject(LoaderService).isLoading$;
}
