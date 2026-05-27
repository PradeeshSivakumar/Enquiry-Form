import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden">
      
      <!-- Toast Notification -->
      <div *ngIf="toastMessage()" 
           class="fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-[0_8px_30px_rgba(37,99,235,0.12)] border border-red-100 bg-white text-red-600 animate-in slide-in-from-top-5 fade-in duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span class="text-sm font-bold tracking-wide">{{ toastMessage() }}</span>
      </div>

      <div class="w-full max-w-[1000px] bg-white rounded-[32px] shadow-[0_2px_8px_rgba(15,23,42,0.04)] border border-[#DCE3F1] flex flex-col md:flex-row overflow-hidden relative z-10 animate-in zoom-in-[0.98] fade-in duration-700">
        
        <!-- Left Branding Panel (Solid Dark-Blue #123C7A) -->
        <div class="hidden md:flex w-[45%] bg-[#123C7A] p-12 flex-col justify-between relative overflow-hidden text-white">
          <div class="relative z-10">
            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center p-1.5 mb-8 ring-4 ring-white/10 transition-transform duration-500 hover:scale-105">
              <img src="img/NTS_ROUND_LOGO.png" alt="Niraltek logo" class="w-full h-full object-contain rounded-full" />
            </div>
            <h2 class="text-3xl lg:text-4xl font-[800] tracking-tight leading-tight mb-4">Niraltek Solutions<br/>CRM</h2>
            <p class="text-blue-100/90 font-medium text-sm leading-relaxed max-w-[85%]">
              Secure access portal for NiralTek Solutions. Manage enterprise directories, visitor data, and system configurations.
            </p>
          </div>
          
          <div class="relative z-10">
            <p class="text-[10px] font-bold text-blue-200/50 tracking-[0.2em] uppercase">© 2026 Niraltek Solutions</p>
          </div>
        </div>

        <!-- Right Login Panel -->
        <div class="w-full md:w-[55%] p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
          
          <div class="md:hidden flex items-center gap-3 mb-8">
            <div class="w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-md p-1 ring-4 ring-[#123C7A]/10">
              <img src="img/NTS_ROUND_LOGO.png" alt="Niraltek logo" class="w-full h-full object-contain rounded-full" />
            </div>
            <div>
              <h2 class="text-lg font-[800] text-[#123C7A] leading-none">NiralTek</h2>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise</p>
            </div>
          </div>

          <div class="mb-10">
            <h1 class="text-2xl sm:text-3xl font-[800] text-slate-900 tracking-tight mb-2">Welcome Back</h1>
            <p class="text-sm text-slate-500 font-medium">Please enter your credentials to log in.</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Email or Mobile -->
            <div>
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Employee Email or Mobile</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-455 group-focus-within:text-[#123C7A] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input type="text" formControlName="email" placeholder="Email or Mobile Number"
                       class="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-[#DCE3F1] rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#123C7A]/5 focus:border-[#123C7A] focus:bg-white transition-all placeholder-slate-400 shadow-sm"
                       [class.border-red-400]="showError('email')" [class.focus:ring-red-500]="showError('email')" />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-455 group-focus-within:text-[#123C7A] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="••••••••"
                       class="w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-[#DCE3F1] rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#123C7A]/5 focus:border-[#123C7A] focus:bg-white transition-all placeholder-slate-400 shadow-sm"
                       [class.border-red-400]="showError('password')" [class.focus:ring-red-500]="showError('password')" />
                <button type="button" (click)="togglePassword()" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#123C7A] transition-colors focus:outline-none">
                  <svg *ngIf="!showPassword()" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  <svg *ngIf="showPassword()" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <label class="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" class="sr-only peer" />
                <div class="w-4 h-4 rounded-md border border-slate-350 bg-slate-50 flex items-center justify-center group-hover:border-slate-400 peer-checked:bg-[#1D4ED8] peer-checked:border-[#1D4ED8] transition-all">
                  <svg class="h-2.5 w-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7L5 11L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="text-xs font-semibold text-slate-500 group-hover:text-[#123C7A] transition-colors">Remember me</span>
              </label>
            </div>

            <button type="submit" [disabled]="loginForm.invalid || isLoading()" 
                    class="w-full mt-6 py-4 bg-[#123C7A] text-white hover:bg-[#0F3267] rounded-2xl text-[14px] font-bold tracking-wide transition-all duration-300 shadow-[0_1px_3px_rgba(15,23,42,0.08)] disabled:bg-slate-400 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
              <span *ngIf="!isLoading()">Sign In</span>
              <svg *ngIf="!isLoading()" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              
              <div *ngIf="isLoading()" class="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </button>
          </form>
          
        </div>
      </div>
    </div>
  `
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  toastMessage = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^([0-9]{10}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})$/i)]],
      password: ['', Validators.required]
    });
  }

  togglePassword() {
    this.showPassword.update(s => !s);
  }

  showError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.toastMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/visitors-directory';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 0) {
          this.toastMessage.set('Network error: Cannot connect to API server.');
        } else {
          this.toastMessage.set(err.error?.message || 'Invalid email or password');
        }
        setTimeout(() => this.toastMessage.set(null), 3000);
      }
    });
  }
}
