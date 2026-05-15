import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderStripComponent } from './header/header-strip.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './header/topbar.component';
import { LayoutService } from './layout.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderStripComponent, SidebarComponent, TopbarComponent],
  template: `
    <app-header-strip />
    <app-topbar />
    
    <div class="flex min-h-screen bg-[#f5f7fb] font-['Inter',system-ui,sans-serif] pt-[72px]">
      <!-- Fixed Sidebar -->
      <app-sidebar />
      
      <!-- Main Content Area -->
      <main class="flex-1 w-full min-w-0 flex flex-col transition-all duration-300"
            [ngClass]="layout.isSidebarCollapsed() ? 'pl-[80px]' : 'pl-[280px]'">
        
        <!-- Router View -->
        <div class="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto flex-1">
          <router-outlet />
        </div>
        
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  layout = inject(LayoutService);
}
