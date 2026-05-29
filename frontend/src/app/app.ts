import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from './shared/loader/loader.component';
import { LoaderService } from './core/loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoaderComponent, CommonModule],
  template: `<app-loader *ngIf="showGlobalLoader()"></app-loader><router-outlet />`,
})
export class App {
  showGlobalLoader = signal<boolean>(true);

  constructor() {
    const router = inject(Router);
    const loader = inject(LoaderService);

    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Only show global fixed loader for public pages (Landing Page, Login, Access Denied)
        const isPublicPage = event.url === '/' || event.url === '' || event.url.startsWith('/login') || event.url.startsWith('/access-denied');
        this.showGlobalLoader.set(isPublicPage);
        loader.show();
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        loader.hide();
      }
    });
  }
}
