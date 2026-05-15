import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  isSidebarCollapsed = signal<boolean>(false);
  
  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }
}
