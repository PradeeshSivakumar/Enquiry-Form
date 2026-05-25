import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../layout.service';
import { AuthService } from '../../core/auth/auth.service';
import { SidebarService, SidebarSection } from './sidebar.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="fixed left-0 top-[72px] h-[calc(100vh-72px)] border-r border-gray-200 bg-white flex flex-col transition-all duration-300 z-40 overflow-y-auto overflow-x-hidden"
           [ngClass]="layout.isSidebarCollapsed() ? 'w-[80px]' : 'w-[280px]'">
      
      <nav class="flex-1 space-y-4 mt-6" [ngClass]="layout.isSidebarCollapsed() ? 'px-3' : 'px-4'">
        
        <div *ngFor="let section of navigation(); let first = first" 
             [ngClass]="{'mt-5': !first && !layout.isSidebarCollapsed()}">
          
          <!-- Section Header (hidden if sidebar is collapsed) -->
          <div *ngIf="!layout.isSidebarCollapsed()" 
               class="px-4 py-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase select-none transition-opacity duration-200">
            {{ section.name }}
          </div>

          <!-- Section Items -->
          <div class="space-y-1 mt-1">
            <a *ngFor="let item of section.items"
               [routerLink]="item.route" 
               routerLinkActive="bg-[#0f172a] text-white" 
               class="flex items-center rounded-lg transition-all group font-semibold text-[13px] text-gray-600 hover:bg-gray-100"
               [ngClass]="layout.isSidebarCollapsed() ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'">
              
              <!-- Icon Container -->
              <span class="flex items-center justify-center shrink-0 h-5 w-5" [innerHTML]="sanitizeIcon(item.icon)"></span>
              
              <span [class.hidden]="layout.isSidebarCollapsed()">{{ item.name }}</span>
            </a>
          </div>

        </div>

      </nav>

      <div class="border-t border-gray-100 mt-auto p-4 flex-shrink-0">
        <button (click)="showLogoutConfirm.set(true)" class="w-full flex items-center rounded-lg transition-all group font-semibold text-[13px] text-red-600 hover:bg-red-50"
                [ngClass]="layout.isSidebarCollapsed() ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'">
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span [class.hidden]="layout.isSidebarCollapsed()">Logout</span>
        </button>
      </div>
    </aside>

    <div *ngIf="showLogoutConfirm()" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl border border-gray-200">
        <h3 class="text-base font-bold text-gray-900">Confirm Logout</h3>
        <p class="text-[13px] text-gray-500 mt-2">Are you sure you want to log out of your session?</p>
        <div class="flex gap-3 mt-6">
          <button (click)="showLogoutConfirm.set(false)" class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-[13px] font-semibold hover:bg-gray-50">Cancel</button>
          <button (click)="executeLogout()" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-[13px] font-semibold hover:bg-red-700">Logout</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep svg {
      width: 1.25rem !important;
      height: 1.25rem !important;
      flex-shrink: 0 !important;
    }
  `]
})
export class SidebarComponent implements OnInit {
  layout = inject(LayoutService);
  authService = inject(AuthService);
  sidebarService = inject(SidebarService);
  sanitizer = inject(DomSanitizer);

  navigation = signal<SidebarSection[]>([]);
  showLogoutConfirm = signal(false);

  ngOnInit() {
    this.loadNavigation();
  }

  loadNavigation() {
    this.sidebarService.getNavigation().subscribe({
      next: (data) => {
        this.navigation.set(data);
      },
      error: (error) => {
        console.error('Error fetching sidebar navigation:', error);
      }
    });
  }

  sanitizeIcon(iconStr: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(iconStr);
  }

  executeLogout() {
    this.authService.logout();
    this.showLogoutConfirm.set(false);
  }
}