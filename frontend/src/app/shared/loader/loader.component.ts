import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../core/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="absolute ? 'absolute-loader' : 'global-loader'" *ngIf="isLoading | async">
      <div class="loader-card">
        <div class="loader-animation">
          <div class="outer-ring"></div>
          <div class="inner-ring"></div>
          <div class="pulse-dot"></div>
        </div>
        <div class="loader-text">NiralTek Solutions</div>
      </div>
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
      background: rgba(15, 23, 42, 0.12);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 99999;
      transition: all 0.3s ease;
    }

    .absolute-loader {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(245, 247, 251, 0.65);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 50;
      transition: all 0.3s ease;
      border-radius: 12px;
    }

    .loader-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      padding: 2.5rem 3.5rem;
      border-radius: 16px;
      box-shadow: 
        0 4px 30px rgba(0, 0, 0, 0.03),
        0 20px 50px -12px rgba(15, 23, 42, 0.12),
        inset 0 1px 1px rgba(255, 255, 255, 0.8);
      max-width: 90vw;
      animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .loader-animation {
      position: relative;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .outer-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3.5px solid transparent;
      border-top-color: #0f172a;
      border-bottom-color: #0f172a;
      animation: spin 1.2s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite;
    }

    .inner-ring {
      position: absolute;
      width: 75%;
      height: 75%;
      border-radius: 50%;
      border: 3px solid transparent;
      border-left-color: #64748b;
      border-right-color: #64748b;
      animation: spin-reverse 1s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite;
    }

    .pulse-dot {
      width: 10px;
      height: 10px;
      background-color: #0f172a;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(15, 23, 42, 0.4);
      animation: pulse-dot 1.2s ease-in-out infinite;
    }

    .loader-text {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      margin-top: 0.5rem;
      animation: pulse-text 1.5s ease-in-out infinite;
      text-align: center;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes spin-reverse {
      0% { transform: rotate(360deg); }
      100% { transform: rotate(0deg); }
    }

    @keyframes pulse-dot {
      0%, 100% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 1; }
    }

    @keyframes pulse-text {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 1; }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    `,
  ],
})
export class LoaderComponent {
  @Input() absolute: boolean = false;
  isLoading = inject(LoaderService).isLoading$;
}
