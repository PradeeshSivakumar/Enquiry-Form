import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="min-h-[calc(100vh-72px)] bg-white flex items-center justify-center p-6">
      <div class="w-full max-w-md text-center">
        <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12V16.5zm-7.938 1.5h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4.5c-.77-1.333-2.694-1.333-3.464 0L2.33 15c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">Access Denied</h1>
        <p class="mt-3 text-sm font-medium leading-6 text-gray-500">Your login role is not authorized to open this module.</p>
        <a routerLink="/visitors-directory" class="mt-6 inline-flex items-center justify-center rounded-[24px] bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800">
          Back to dashboard
        </a>
      </div>
    </section>
  `,
})
export class AccessDeniedPageComponent {}
