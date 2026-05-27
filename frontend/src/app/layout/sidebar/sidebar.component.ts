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
    <aside class="fixed left-0 top-[72px] h-[calc(100vh-72px)] border-r border-white/5 sidebar-theme flex flex-col transition-all duration-300 ease-in-out z-40 overflow-hidden shadow-2xl"
           [ngClass]="layout.isSidebarCollapsed() ? 'w-[80px]' : 'w-[280px]'">
      
      <nav class="flex-1 overflow-y-auto overflow-x-hidden space-y-4 mt-6 transition-all duration-300 ease-in-out" [ngClass]="layout.isSidebarCollapsed() ? 'px-3' : 'px-4'">
        
        <div *ngFor="let section of navigation(); let first = first">
          
          <hr *ngIf="!first" class="my-4 border-t border-white/5" />

          <button (click)="toggleSection(section.id)"
                  class="w-full flex items-center pl-4 pr-1 text-left text-[10px] font-bold tracking-wider text-blue-300/70 uppercase select-none transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap cursor-pointer hover:text-white focus:outline-none"
                  [ngClass]="layout.isSidebarCollapsed() ? 'opacity-0 max-w-0 h-0 py-0 mt-0 pointer-events-none' : 'opacity-100 max-w-full h-7 py-1 mt-1'">
            
            <span class="truncate transition-colors duration-300">
              {{ section.name }}
            </span>

            <div class="ml-auto flex items-center justify-end pr-1">
              <svg class="h-3.5 w-3.5 text-blue-300/70 transition-transform duration-300 ease-in-out shrink-0 group-hover:text-white"
                   [class.rotate-180]="expandedSections().has(section.id)"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          <button (click)="toggleSection(section.id)"
                  class="w-full flex justify-center text-blue-200 select-none transition-all duration-300 ease-in-out overflow-hidden focus:outline-none cursor-pointer"
                  [ngClass]="layout.isSidebarCollapsed() ? 'opacity-100 max-w-[80px] h-10 py-2' : 'opacity-0 max-w-0 h-0 py-0 pointer-events-none'">
            
            <span *ngIf="section.name.toLowerCase() === 'dashboard'" [title]="section.name"
                  [ngClass]="expandedSections().has(section.id) ? 'bg-blue-500 border-blue-400 text-white shadow-md' : 'bg-[#112240] border-white/5 text-blue-200 hover:text-white hover:bg-[#1a365d] hover:border-white/10'"
                  class="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300">
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            </span>

            <span *ngIf="section.name.toLowerCase() === 'services'" [title]="section.name"
                  [ngClass]="expandedSections().has(section.id) ? 'bg-blue-500 border-blue-400 text-white shadow-md' : 'bg-[#112240] border-white/5 text-blue-200 hover:text-white hover:bg-[#1a365d] hover:border-white/10'"
                  class="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300">
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </span>

            <span *ngIf="section.name.toLowerCase() === 'master'" [title]="section.name"
                  [ngClass]="expandedSections().has(section.id) ? 'bg-blue-500 border-blue-400 text-white shadow-md' : 'bg-[#112240] border-white/5 text-blue-200 hover:text-white hover:bg-[#1a365d] hover:border-white/10'"
                  class="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300">
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
            </span>

            <span *ngIf="section.name.toLowerCase().includes('roles')" [title]="section.name"
                  [ngClass]="expandedSections().has(section.id) ? 'bg-blue-500 border-blue-400 text-white shadow-md' : 'bg-[#112240] border-white/5 text-blue-200 hover:text-white hover:bg-[#1a365d] hover:border-white/10'"
                  class="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300">
                <span [innerHTML]="sanitizeIcon(getSectionIconSvg(section))"></span>
            </span>
          </button>

          <div class="transition-all duration-300 ease-in-out overflow-hidden"
               [ngClass]="expandedSections().has(section.id) ? 'max-h-[500px] opacity-100 mt-2 pointer-events-auto' : 'max-h-0 opacity-0 mt-0 pointer-events-none'">
            <div class="space-y-1.5">
              <a *ngFor="let item of section.items"
                 [routerLink]="item.route" 
                 routerLinkActive="active-link" 
                 class="flex items-center rounded-r-lg rounded-l-none border-l-4 border-transparent transition-all duration-300 ease-in-out group font-medium text-[13px] text-blue-200"
                 [ngClass]="layout.isSidebarCollapsed() ? 'px-3 py-3 justify-center gap-0' : 'gap-3 px-4 py-2.5'">
                
                <span class="flex items-center justify-center shrink-0 h-5 w-5 opacity-80 group-hover:opacity-100 transition-opacity" [innerHTML]="sanitizeIcon(getIconSvg(item))"></span>
                
                <span class="transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap"
                      [ngClass]="layout.isSidebarCollapsed() ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[180px]'">
                  {{ item.name }}
                </span>
              </a>
            </div>
          </div>

        </div>

      </nav>

      <div class="border-t border-white/5 mt-auto p-4 flex-shrink-0 bg-[#0A192F]/80 backdrop-blur-sm">
        <button (click)="showLogoutConfirm.set(true)" class="w-full flex items-center rounded-r-lg rounded-l-none border-l-4 border-transparent transition-all duration-300 ease-in-out group font-semibold text-[13px] text-blue-200 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500"
                [ngClass]="layout.isSidebarCollapsed() ? 'px-3 py-3 justify-center gap-0' : 'gap-3 px-4 py-2.5'">
          <svg class="h-5 w-5 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          
          <span class="transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap"
                [ngClass]="layout.isSidebarCollapsed() ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[180px]'">
            Logout
          </span>
        </button>
      </div>
    </aside>

    <div *ngIf="showLogoutConfirm()" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-opacity">
      <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 transform transition-all scale-100">
        <h3 class="text-lg font-bold text-gray-900">Confirm Logout</h3>
        <p class="text-[14px] text-gray-500 mt-2">Are you sure you want to log out of your session?</p>
        <div class="flex gap-3 mt-6">
          <button (click)="showLogoutConfirm.set(false)" class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button (click)="executeLogout()" class="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-[13px] font-semibold shadow-sm hover:bg-red-700 hover:shadow transition-all">Logout</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep svg {
      width: 1.25rem !important;
      height: 1.25rem !important;
      flex-shrink: 0 !important;
      transition: all 0.3s ease;
    }

    aside.sidebar-theme {
      background-color: #0A192F !important;
    }

    nav a:hover:not(.active-link) {
      background-color: #112240 !important;
      color: #FFFFFF !important;
      border-left: 4px solid #3B82F6 !important;
    }

    nav a:hover:not(.active-link) ::ng-deep svg {
      color: #FFFFFF !important;
      stroke: #FFFFFF !important;
    }

    nav a:hover:not(.active-link) span:not(.shrink-0) {
      transform: translateX(4px); 
    }

    .active-link {
      background-color: #3B82F6 !important;
      color: #FFFFFF !important;
      border-left: 4px solid #93C5FD !important;
      border-top-right-radius: 8px !important;
      border-bottom-right-radius: 8px !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .active-link ::ng-deep svg {
      color: #FFFFFF !important;
      stroke: #FFFFFF !important;
      opacity: 1 !important;
    }

    .active-link:hover {
      background-color: #2563EB !important;
      border-left-color: #FFFFFF !important;
    }

    nav::-webkit-scrollbar {
      width: 5px;
    }
    nav::-webkit-scrollbar-track {
      background: transparent;
    }
    nav::-webkit-scrollbar-thumb {
      background: transparent;
      border-radius: 99px;
      transition: background-color 0.2s ease-in-out;
    }
    aside:hover nav::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1); 
    }
    nav::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.25) !important; 
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
        <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 2C7.03 4.17 4 7.97 4 12.5c0 4.97 4.03 9.19 8 9.5 3.97-.31 8-4.53 8-9.5 0-4.53-3.03-8.33-8-10.5z" />
        </svg>
      `;
    } else if (item.route === '/permissions') {
      return `
        <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 3a1 1 0 012 0v1a1 1 0 011 1v1a1 1 0 011 1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1 1v1a1 1 0 01-1 1v1a1 1 0 01-2 0v-1a1 1 0 01-1-1h-1a1 1 0 01-1-1v-1a1 1 0 01-1-1H7a1 1 0 01-1-1V8a1 1 0 011-1h1a1 1 0 011-1V5a1 1 0 011-1V3z" />
        </svg>
      `;
    }

    return '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"></svg>';
  }

  getSectionIconSvg(section: SidebarSection): string {
    if (section.name.toLowerCase().includes('roles')) {
      return `
        <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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