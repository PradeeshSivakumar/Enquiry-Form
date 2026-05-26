import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../layout.service';
import { AuthService } from '../../core/auth/auth.service';
import { SidebarService, SidebarSection, SidebarItem } from './sidebar.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="fixed left-0 top-[72px] h-[calc(100vh-72px)] border-r border-[#1e293b] bg-[#0b1329] flex flex-col transition-all duration-300 ease-in-out z-40 overflow-y-auto overflow-x-hidden shadow-xl"
           [ngClass]="layout.isSidebarCollapsed() ? 'w-[80px]' : 'w-[280px]'">
      
      <nav class="flex-1 space-y-4 mt-6 transition-all duration-300 ease-in-out" [ngClass]="layout.isSidebarCollapsed() ? 'px-3' : 'px-4'">
        
        <div *ngFor="let section of navigation(); let first = first">
          
          <!-- Section Divider Line (shown when expanded and compressed) -->
          <hr *ngIf="!first" class="my-4 border-t border-[#1e293b]" />
 
          <!-- Section Header (transition opacity, width, height, and padding smoothly) -->
          <button (click)="toggleSection(section.id)"
        class="w-full flex items-center pl-4 pr-1 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap cursor-pointer hover:text-slate-200 focus:outline-none"
        [ngClass]="layout.isSidebarCollapsed() ? 'opacity-0 max-w-0 h-0 py-0 mt-0 pointer-events-none' : 'opacity-100 max-w-full h-7 py-1 mt-1'">

  <!-- Section Title -->
  <span class="truncate">
    {{ section.name }}
  </span>

  <!-- Arrow pushed fully right -->
  <div class="ml-auto flex items-center justify-end pr-1">
    <svg
      class="h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ease-in-out shrink-0"
      [class.rotate-180]="expandedSections().has(section.id)"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2.5">

      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M19 9l-7 7-7-7" />

    </svg>
  </div>

</button>
 
          <!-- Section Header when collapsed (shows a highly distinct small visual pill/badge for Dashboard, Services, and Master - transitioning smoothly) -->
          <button (click)="toggleSection(section.id)"
                   class="w-full flex justify-center text-slate-400 select-none transition-all duration-300 ease-in-out overflow-hidden focus:outline-none cursor-pointer"
                   [ngClass]="layout.isSidebarCollapsed() ? 'opacity-100 max-w-[80px] h-10 py-2' : 'opacity-0 max-w-0 h-0 py-0 pointer-events-none'"
                 >
            <span *ngIf="section.name.toLowerCase() === 'dashboard'" [title]="section.name"
                  [ngClass]="expandedSections().has(section.id) ? 'bg-[#1e293b] border-slate-700 text-slate-100' : 'bg-[#080d1d] border-[#1e293b] text-slate-500 hover:text-slate-300 hover:bg-[#121b36]'"
                  class="flex items-center justify-center w-7 h-7 rounded border shadow-sm transition-all duration-300">
                <svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            </span>
            <span *ngIf="section.name.toLowerCase() === 'services'" [title]="section.name"
                  [ngClass]="expandedSections().has(section.id) ? 'bg-[#1e293b] border-slate-700 text-slate-100' : 'bg-[#080d1d] border-[#1e293b] text-slate-500 hover:text-slate-300 hover:bg-[#121b36]'"
                  class="flex items-center justify-center w-7 h-7 rounded border shadow-sm transition-all duration-300">
                <svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </span>
            <span *ngIf="section.name.toLowerCase() === 'master'" [title]="section.name"
                  [ngClass]="expandedSections().has(section.id) ? 'bg-[#1e293b] border-slate-700 text-slate-100' : 'bg-[#080d1d] border-[#1e293b] text-slate-500 hover:text-slate-300 hover:bg-[#121b36]'"
                  class="flex items-center justify-center w-7 h-7 rounded border shadow-sm transition-all duration-300">
                <svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
            </span>
            <span *ngIf="section.name.toUpperCase() === 'ROLES AND PERMISSIONS'" class="flex items-center justify-center w-7 h-7 rounded border shadow-sm transition-all duration-300"
                  [ngClass]="expandedSections().has(section.id) ? 'bg-[#1e293b] border-slate-700 text-slate-100' : 'bg-[#080d1d] border-[#1e293b] text-slate-500 hover:text-slate-300 hover:bg-[#121b36]'">
                <span [innerHTML]="sanitizeIcon(getSectionIconSvg(section))"></span>
            </span>
          </button>
 
          <!-- Section Items (Dropdown animated wrapper) -->
          <div class="transition-all duration-300 ease-in-out overflow-hidden"
               [ngClass]="expandedSections().has(section.id) ? 'max-h-[500px] opacity-100 mt-1 pointer-events-auto' : 'max-h-0 opacity-0 mt-0 pointer-events-none'">
            <div class="space-y-1">
              <a *ngFor="let item of section.items"
                 [routerLink]="item.route" 
                 routerLinkActive="active-link" 
                 class="flex items-center rounded-r-lg rounded-l-none border-l-4 border-transparent transition-all duration-300 ease-in-out group font-semibold text-[13px] text-slate-300 hover:bg-slate-800/40 hover:text-white"
                 [ngClass]="layout.isSidebarCollapsed() ? 'px-3 py-3 justify-center gap-0' : 'gap-3 px-4 py-2.5'">
                
                <!-- Icon Container -->
                <span class="flex items-center justify-center shrink-0 h-5 w-5 text-slate-400 group-hover:text-white transition-colors" [innerHTML]="sanitizeIcon(getIconSvg(item))"></span>
                
                <!-- Link Text (smooth transition) -->
                <span class="transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap"
                      [ngClass]="layout.isSidebarCollapsed() ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[180px]'">
                  {{ item.name }}
                </span>
              </a>
            </div>
          </div>
 
        </div>
 
      </nav>
 
      <div class="border-t border-[#1e293b] mt-auto p-4 flex-shrink-0">
        <button (click)="showLogoutConfirm.set(true)" class="w-full flex items-center rounded-r-lg rounded-l-none border-l-4 border-transparent transition-all duration-300 ease-in-out group font-semibold text-[13px] text-slate-400 hover:bg-red-950/20 hover:text-red-400 hover:border-red-500"
                [ngClass]="layout.isSidebarCollapsed() ? 'px-3 py-3 justify-center gap-0' : 'gap-3 px-4 py-2.5'">
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          
          <!-- Button Text (smooth transition) -->
          <span class="transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap"
                [ngClass]="layout.isSidebarCollapsed() ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[180px]'">
            Logout
          </span>
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
      transition: color 0.3s ease, stroke 0.3s ease;
    }
 
    .active-link {
      background-color: rgba(30, 41, 59, 0.7) !important; /* Slate 800/70 */
      color: #ffffff !important;
      border-left-color: #3b82f6 !important; /* Blue 500 left border */
      border-top-right-radius: 8px !important;
      border-bottom-right-radius: 8px !important;
      border-top-left-radius: 0px !important;
      border-bottom-left-radius: 0px !important;
    }
 
    .active-link ::ng-deep svg {
      color: #3b82f6 !important;
      stroke: #3b82f6 !important;
    }
 
    .active-link:hover {
      background-color: rgba(30, 41, 59, 0.9) !important;
      color: #ffffff !important;
    }
 
    .active-link:hover ::ng-deep svg {
      color: #3b82f6 !important;
      stroke: #3b82f6 !important;
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
  expandedSections = signal<Set<number>>(new Set());

  ngOnInit() {
    this.loadNavigation();
  }

  loadNavigation() {
    this.sidebarService.getNavigation().subscribe({
      next: (data) => {
        this.navigation.set(data);
        const ids = data.map(sec => sec.id);
        this.expandedSections.set(new Set(ids));
      },
      error: (error) => {
        console.error('Error fetching sidebar navigation:', error);
      }
    });
  }

  toggleSection(sectionId: number): void {
    const current = new Set(this.expandedSections());
    if (current.has(sectionId)) {
      current.delete(sectionId);
    } else {
      current.add(sectionId);
    }
    this.expandedSections.set(current);
  }

  sanitizeIcon(iconStr: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(iconStr);
  }

  getIconSvg(item: SidebarItem): string {
    if (item.icon) {
      return item.icon;
    }

    if (item.route === '/roles') {  
      return `
        <svg class="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12l2 2 4-4" />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 2C7.03 4.17 4 7.97 4 12.5c0 4.97 4.03 9.19 8 9.5 3.97-.31 8-4.53 8-9.5 0-4.53-3.03-8.33-8-10.5z" />
        </svg>
      `;
    } else if (item.route === '/permissions') {
      // Gear icon for permissions
      return `
        <svg class="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 3a1 1 0 012 0v1a1 1 0 011 1v1a1 1 0 011 1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1 1v1a1 1 0 01-1 1v1a1 1 0 01-2 0v-1a1 1 0 01-1-1h-1a1 1 0 01-1-1v-1a1 1 0 01-1-1H7a1 1 0 01-1-1V8a1 1 0 011-1h1a1 1 0 011-1V5a1 1 0 011-1V3z" />
        </svg>
      `;
    }

    return '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"></svg>';
  }

  // Returns SVG for compact section icons when sidebar is collapsed
  getSectionIconSvg(section: SidebarSection): string {
    if (section.name.toUpperCase() === 'ROLES AND PERMISSIONS') {
      return `
        <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 2l7 4v6c0 5-3 9-7 11-4-2-7-6-7-11V6l7-4z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8a3 3 0 100 6 3 3 0 000-6z"/>
        </svg>`;
    }
    return '';
  }

  executeLogout() {
    this.authService.logout();
    this.showLogoutConfirm.set(false);
  }
}