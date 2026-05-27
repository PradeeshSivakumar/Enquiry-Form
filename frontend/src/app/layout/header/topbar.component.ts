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
    <header class="fixed top-0 left-0 w-full z-50 bg-white border-b border-[#DCE3F1] shadow-[0_1px_4px_rgba(15,23,42,0.04)] transition-all duration-300">
      <div class="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-[72px]">
        <div class="flex items-center gap-4">
          <button (click)="layout.toggleSidebar()" class="p-2 rounded-xl hover:bg-[#F8FAFC] text-gray-600 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
 
          <div class="flex items-center gap-2">
            <h2 class="text-[16px] sm:text-[18px] font-extrabold text-[#1E293B] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">Niraltek Enquiry Form</h2>
          </div>
        </div>

        <div class="flex items-center gap-3" *ngIf="authService.currentUser() as user">
          <!-- Profile Dropdown Container -->
          <div #profileContainer class="relative flex items-center">
            <button
              type="button"
              (click)="toggleProfileMenu()"
              class="flex items-center gap-3 rounded-full border border-[#DCE3F1] bg-white p-1.5 pr-4 shadow-sm transition hover:border-[#123C7A] hover:bg-[#F8FAFC] hover:ring-2 hover:ring-[#123C7A]/5"
              aria-haspopup="menu"
              [attr.aria-expanded]="isProfileMenuOpen()">
              <img [src]="'https://ui-avatars.com/api/?name=' + user.name.split(' ').join('+') + '&background=123C7A&color=fff'" alt="User" class="h-8 w-8 rounded-full object-cover shadow-inner" />
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
              class="absolute right-0 top-[calc(100%+10px)] z-[90] w-64 overflow-hidden rounded-2xl border border-[#DCE3F1] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
              role="menu">
              <div class="border-b border-[#DCE3F1] px-4 py-3 bg-[#F8FAFC]">
                <div class="text-sm font-extrabold text-[#123C7A]">{{ user.name }}</div>
                <div class="mt-0.5 text-xs font-bold uppercase tracking-wide text-gray-500">{{ user.role }}</div>
              </div>
              <button
                type="button"
                (click)="openPasswordModal()"
                class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-gray-800 transition hover:bg-[#F8FAFC] hover:text-[#123C7A]"
                role="menuitem">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#123C7A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586l6.257-6.257A6 6 0 1121 9z" />
                </svg>
                Change Password
              </button>

              <button
                type="button"
                (click)="openLogoutConfirm()"
                class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[#DC2626] transition hover:bg-red-50/50 border-t border-[#DCE3F1]"
                role="menuitem">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout Session
              </button>
            </div>
          </div>

          <!-- Divider -->
          <div class="h-5 w-[1px] bg-[#DCE3F1] hidden sm:block"></div>

          <!-- Separate Outlined Red Logout Button (Right-most Corner) -->
          <button
            type="button"
            (click)="openLogoutConfirm()"
            class="group flex items-center rounded-xl border border-[#DC2626] bg-white h-[38px] px-3.5 shadow-sm transition-all duration-200 hover:bg-red-50/50 hover:shadow-md cursor-pointer focus:outline-none shrink-0"
            title="Log Out">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#DC2626] transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Change Password Modal -->
    <div *ngIf="isPasswordModalOpen()" class="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div class="w-full max-w-md overflow-hidden rounded-[20px] border border-[#DCE3F1] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div class="flex items-center justify-between border-b border-[#DCE3F1] px-6 py-5">
          <div>
            <h2 class="text-lg font-extrabold tracking-tight text-gray-900">Change Password</h2>
            <p class="mt-0.5 text-xs font-medium text-gray-500">Update your own login password</p>
          </div>
          <button type="button" (click)="closePasswordModal()" class="rounded-full border border-[#DCE3F1] bg-[#F8FAFC] p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form [formGroup]="passwordForm" (ngSubmit)="submitPasswordChange()" class="flex flex-col">
          <div class="space-y-4 bg-[#F8FAFC]/50 p-6">
            <div *ngIf="passwordError()" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
              {{ passwordError() }}
            </div>
            <div>
              <label class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Current Password</label>
              <input type="password" formControlName="currentPassword" class="w-full rounded-lg border border-[#DCE3F1] bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-[#123C7A] focus:ring-2 focus:ring-[#123C7A]/5" [class.border-red-400]="passwordFieldInvalid('currentPassword')" />
            </div>
            <div>
              <label class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">New Password</label>
              <input type="password" formControlName="newPassword" class="w-full rounded-lg border border-[#DCE3F1] bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-[#123C7A] focus:ring-2 focus:ring-[#123C7A]/5" [class.border-red-400]="passwordFieldInvalid('newPassword')" />
              <span *ngIf="passwordFieldInvalid('newPassword')" class="mt-1 block text-[10px] font-bold text-red-550">Minimum 8 characters</span>
            </div>
            <div>
              <label class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Confirm Password</label>
              <input type="password" formControlName="confirmPassword" class="w-full rounded-lg border border-[#DCE3F1] bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-[#123C7A] focus:ring-2 focus:ring-[#123C7A]/5" [class.border-red-400]="passwordFieldInvalid('confirmPassword') || passwordForm.hasError('passwordMismatch')" />
              <span *ngIf="passwordForm.hasError('passwordMismatch') && passwordForm.touched" class="mt-1 block text-[10px] font-bold text-red-555">Passwords do not match</span>
            </div>
          </div>
          <div class="flex justify-end gap-3 border-t border-[#DCE3F1] bg-white px-6 py-4">
            <button type="button" (click)="closePasswordModal()" class="rounded-lg border border-[#DCE3F1] bg-white px-5 py-2.5 text-sm font-bold text-gray-600 transition-all hover:bg-[#F8FAFC] hover:text-gray-900">Cancel</button>
            <button type="submit" [disabled]="isChangingPassword()" class="rounded-lg bg-[#123C7A] hover:bg-[#0F3267] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all disabled:opacity-50">
              {{ isChangingPassword() ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <div *ngIf="isLogoutModalOpen()" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-opacity">
      <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 transform transition-all scale-100">
        <h3 class="text-lg font-bold text-gray-900">Confirm Logout</h3>
        <p class="text-[14px] text-gray-500 mt-2">Are you sure you want to log out of your session?</p>
        <div class="flex gap-3 mt-6">
          <button (click)="closeLogoutModal()" class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button (click)="executeLogout()" class="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-[13px] font-semibold shadow-sm hover:bg-red-700 hover:shadow transition-all">Logout</button>
        </div>
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
  isLogoutModalOpen = signal(false);

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

  openLogoutConfirm(): void {
    this.isProfileMenuOpen.set(false);
    this.isLogoutModalOpen.set(true);
  }

  closeLogoutModal(): void {
    this.isLogoutModalOpen.set(false);
  }

  executeLogout(): void {
    this.authService.logout();
    this.isLogoutModalOpen.set(false);
  }
}
