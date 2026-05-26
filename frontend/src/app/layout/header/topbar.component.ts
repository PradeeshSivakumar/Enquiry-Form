import { Component, inject, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LayoutService } from '../layout.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <header class="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all duration-300">
      <div class="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-[72px]">
        <div class="flex items-center gap-4">
          <button (click)="layout.toggleSidebar()" class="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div class="flex items-center gap-2">
            <h2 class="text-[16px] sm:text-[18px] font-extrabold text-slate-800 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">Niraltek Enquiry Form</h2>
          </div>
        </div>

        <div #profileContainer class="relative flex items-center gap-2 sm:gap-4" *ngIf="authService.currentUser() as user">
          <button
            type="button"
            (click)="toggleProfileMenu()"
            class="flex items-center gap-3 rounded-full border border-gray-200 bg-white p-1.5 pr-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            aria-haspopup="menu"
            [attr.aria-expanded]="isProfileMenuOpen()">
            <img [src]="'https://ui-avatars.com/api/?name=' + user.name.split(' ').join('+') + '&background=111111&color=fff'" alt="User" class="h-8 w-8 rounded-full object-cover shadow-inner" />
            <div class="hidden md:flex flex-col items-start justify-center">
              <span class="text-[13px] font-bold text-gray-900 leading-tight">{{ user.name }}</span>
              <span class="text-[11px] font-semibold text-gray-500 leading-tight uppercase tracking-wide">{{ user.role }}</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="hidden h-4 w-4 text-gray-400 transition-transform md:block" [class.rotate-180]="isProfileMenuOpen()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            *ngIf="isProfileMenuOpen()"
            class="absolute right-0 top-[calc(100%+10px)] z-[90] w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_60px_-20px_rgba(0,0,0,0.35)]"
            role="menu">
            <div class="border-b border-gray-100 px-4 py-3">
              <div class="text-sm font-extrabold text-gray-900">{{ user.name }}</div>
              <div class="mt-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">{{ user.role }}</div>
            </div>
            <button
              type="button"
              (click)="openPasswordModal()"
              class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-gray-800 transition hover:bg-gray-50"
              role="menuitem">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586l6.257-6.257A6 6 0 1121 9z" />
              </svg>
              Change Password
            </button>
          </div>
        </div>
      </div>

    </header>

    <div *ngIf="isPasswordModalOpen()" class="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-black/40 p-4 backdrop-blur-[6px]">
      <div class="w-full max-w-md overflow-hidden rounded-[20px] border border-white/20 bg-white shadow-[0_24px_80px_-15px_rgba(0,0,0,0.4)]">
        <div class="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 class="text-lg font-extrabold tracking-tight text-gray-900">Change Password</h2>
            <p class="mt-0.5 text-xs font-medium text-gray-500">Update your own login password</p>
          </div>
          <button type="button" (click)="closePasswordModal()" class="rounded-full border border-gray-200/60 bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form [formGroup]="passwordForm" (ngSubmit)="submitPasswordChange()" class="flex flex-col">
          <div class="space-y-4 bg-gray-50/50 p-6">
            <div *ngIf="passwordError()" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
              {{ passwordError() }}
            </div>
            <div>
              <label class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Current Password</label>
              <input type="password" formControlName="currentPassword" class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-gray-900" [class.border-red-400]="passwordFieldInvalid('currentPassword')" />
            </div>
            <div>
              <label class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">New Password</label>
              <input type="password" formControlName="newPassword" class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-gray-900" [class.border-red-400]="passwordFieldInvalid('newPassword')" />
              <span *ngIf="passwordFieldInvalid('newPassword')" class="mt-1 block text-[10px] font-bold text-red-500">Minimum 8 characters</span>
            </div>
            <div>
              <label class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Confirm Password</label>
              <input type="password" formControlName="confirmPassword" class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-gray-900" [class.border-red-400]="passwordFieldInvalid('confirmPassword') || passwordForm.hasError('passwordMismatch')" />
              <span *ngIf="passwordForm.hasError('passwordMismatch') && passwordForm.touched" class="mt-1 block text-[10px] font-bold text-red-500">Passwords do not match</span>
            </div>
          </div>
          <div class="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
            <button type="button" (click)="closePasswordModal()" class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900">Cancel</button>
            <button type="submit" [disabled]="isChangingPassword()" class="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-black disabled:opacity-50">
              {{ isChangingPassword() ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class TopbarComponent {
  layout = inject(LayoutService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  
  @ViewChild('profileContainer') profileContainer?: ElementRef;

  isPasswordModalOpen = signal(false);
  isProfileMenuOpen = signal(false);
  isChangingPassword = signal(false);
  passwordError = signal<string | null>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isProfileMenuOpen() && this.profileContainer && !this.profileContainer.nativeElement.contains(event.target as Node)) {
      this.isProfileMenuOpen.set(false);
    }
  }

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, {
    validators: (control) => {
      const newPassword = control.get('newPassword')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      return newPassword && confirmPassword && newPassword !== confirmPassword ? { passwordMismatch: true } : null;
    }
  });

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update(open => !open);
  }

  openPasswordModal(): void {
    this.isProfileMenuOpen.set(false);
    this.passwordForm.reset();
    this.passwordError.set(null);
    this.isPasswordModalOpen.set(true);
  }

  closePasswordModal(): void {
    this.isPasswordModalOpen.set(false);
    this.passwordError.set(null);
    this.passwordForm.reset();
  }

  passwordFieldInvalid(controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'): boolean {
    const control = this.passwordForm.get(controlName);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const values = this.passwordForm.value;
    this.isChangingPassword.set(true);
    this.passwordError.set(null);
    this.authService.changePassword({
      currentPassword: values.currentPassword || '',
      newPassword: values.newPassword || '',
    }).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.closePasswordModal();
      },
      error: (err) => {
        this.passwordError.set(err.error?.message || 'Failed to change password');
        this.isChangingPassword.set(false);
      }
    });
  }
}
