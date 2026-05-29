import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderStripComponent } from './header/header-strip.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './header/topbar.component';
import { LayoutService } from './layout.service';
import { PermissionService } from '../core/permissions/permission.service';
import { LoaderComponent } from '../shared/loader/loader.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderStripComponent, SidebarComponent, TopbarComponent, LoaderComponent],
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
        <div class="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto flex-1 relative min-h-[400px]">
          <app-loader [absolute]="true"></app-loader>
          <router-outlet />
        </div>
        
      </main>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit {
  layout = inject(LayoutService);
  private permissionService = inject(PermissionService);

  ngOnInit() {
    this.permissionService.loadPermissions().subscribe();
  }
}
