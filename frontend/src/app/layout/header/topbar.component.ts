import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../layout.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all duration-300">
      <div class="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-[72px]">
        
        <!-- Left Section -->
        <div class="flex items-center gap-4">
          <!-- Hamburger Menu (Sidebar Toggle) -->
          <button (click)="layout.toggleSidebar()" class="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div class="flex items-center gap-2">
            <h2 class="text-[18px] font-extrabold text-black tracking-tight font-['Syne',sans-serif]">Niraltek Enquiry Form</h2>
          </div>

        </div>

        <!-- Right Section -->
        <div class="flex items-center gap-2 sm:gap-4" *ngIf="authService.currentUser() as user">
          <div class="flex items-center gap-3 p-1.5 pr-4 rounded-full border border-gray-200 bg-white shadow-sm">
            <img [src]="'https://ui-avatars.com/api/?name=' + user.name.split(' ').join('+') + '&background=111111&color=fff'" alt="User" class="h-8 w-8 rounded-full object-cover shadow-inner" />
            <div class="hidden md:flex flex-col items-start justify-center">
              <span class="text-[13px] font-bold text-gray-900 leading-tight">{{ user.name }}</span>
              <span class="text-[11px] font-semibold text-gray-500 leading-tight uppercase tracking-wide">{{ user.role }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: []
})
export class TopbarComponent {
  layout = inject(LayoutService);
  authService = inject(AuthService);
}
