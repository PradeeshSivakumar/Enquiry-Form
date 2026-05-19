import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../layout.service';
import { AuthService } from '../../core/auth/auth.service';
import { PRODUCT_MASTER_ROLES } from '../../auth/guards/role.guard';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="fixed left-0 top-[72px] h-[calc(100vh-72px)] border-r border-gray-200 bg-white flex flex-col transition-all duration-300 z-40 overflow-y-auto overflow-x-hidden"
           [ngClass]="layout.isSidebarCollapsed() ? 'w-[80px]' : 'w-[280px]'">
      
      <!-- Navigation -->
      <nav class="flex-1 space-y-2 mt-6" [ngClass]="layout.isSidebarCollapsed() ? 'px-3' : 'px-4'">
        <a routerLink="/visitors-directory" routerLinkActive="bg-black text-white" [routerLinkActiveOptions]="{exact: false}" 
           class="flex items-center rounded-xl transition-all group font-semibold text-[14px]"
           [ngClass]="layout.isSidebarCollapsed() ? 'justify-center p-3' : 'gap-3 px-4 py-3 hover:bg-gray-100 text-gray-600'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span class="whitespace-nowrap transition-opacity duration-200" [class.opacity-0]="layout.isSidebarCollapsed()" [class.hidden]="layout.isSidebarCollapsed()">Visitors Directory</span>
        </a>
        
        <a routerLink="/employee" routerLinkActive="bg-black text-white" [routerLinkActiveOptions]="{exact: false}" 
           class="flex items-center rounded-xl transition-all group font-semibold text-[14px]"
           [ngClass]="layout.isSidebarCollapsed() ? 'justify-center p-3' : 'gap-3 px-4 py-3 hover:bg-gray-100 text-gray-600'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
          <span class="whitespace-nowrap transition-opacity duration-200" [class.opacity-0]="layout.isSidebarCollapsed()" [class.hidden]="layout.isSidebarCollapsed()">Employee</span>
        </a>

        <a routerLink="/venue" routerLinkActive="bg-black text-white" [routerLinkActiveOptions]="{exact: false}" 
           class="flex items-center rounded-xl transition-all group font-semibold text-[14px]"
           [ngClass]="layout.isSidebarCollapsed() ? 'justify-center p-3' : 'gap-3 px-4 py-3 hover:bg-gray-100 text-gray-600'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="whitespace-nowrap transition-opacity duration-200" [class.opacity-0]="layout.isSidebarCollapsed()" [class.hidden]="layout.isSidebarCollapsed()">Venue</span>
        </a>

        <a *ngIf="canAccessProducts()" routerLink="/products" routerLinkActive="bg-black text-white" [routerLinkActiveOptions]="{exact: false}" 
           class="flex items-center rounded-xl transition-all group font-semibold text-[14px]"
           [ngClass]="layout.isSidebarCollapsed() ? 'justify-center p-3' : 'gap-3 px-4 py-3 hover:bg-gray-100 text-gray-600'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.29 7L12 12l8.71-5M12 22V12" />
          </svg>
          <span class="whitespace-nowrap transition-opacity duration-200" [class.opacity-0]="layout.isSidebarCollapsed()" [class.hidden]="layout.isSidebarCollapsed()">Products</span>
        </a>
      </nav>

      <!-- Bottom Section -->
      <div class="border-t border-gray-100 mt-auto" [ngClass]="layout.isSidebarCollapsed() ? 'p-3' : 'p-4'">

        <a href="javascript:void(0)" (click)="logout()" class="flex items-center rounded-xl transition-all group font-semibold text-[14px]"
           [ngClass]="layout.isSidebarCollapsed() ? 'justify-center p-3 text-red-600' : 'gap-3 px-4 py-3 hover:bg-red-50 text-red-600'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="whitespace-nowrap transition-opacity duration-200" [class.opacity-0]="layout.isSidebarCollapsed()" [class.hidden]="layout.isSidebarCollapsed()">Logout</span>
        </a>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  layout = inject(LayoutService);
  authService = inject(AuthService);
  canAccessProducts = computed(() => this.authService.hasRole(PRODUCT_MASTER_ROLES));

  logout() {
    this.authService.logout();
  }
}
