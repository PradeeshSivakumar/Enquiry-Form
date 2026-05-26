import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { LoaderComponent } from './shared/loader/loader.component';
import { LoaderService } from './core/loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoaderComponent],
  template: `<app-loader></app-loader><router-outlet />`,
})
export class App {
  constructor() {
    const router = inject(Router);
    const loader = inject(LoaderService);

    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        loader.show();
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        loader.hide();
      }
    });
  }
}
