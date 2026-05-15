import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { OptionItem } from '../../../core/constants/form-options';

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <label [for]="inputId" class="mb-2 block text-[0.95rem] font-semibold text-slate-800">{{ label }}</label>
    <div class="relative">
      <select
        [id]="inputId"
        [formControl]="control"
        [attr.aria-invalid]="showError"
        class="h-[52px] w-full appearance-none rounded-xl border border-[#d1d5db] bg-white px-4 pr-11 text-sm text-slate-800 transition duration-200 hover:!border-[#1f1f1f] hover:shadow-[0_0_0_4px_rgba(31,31,31,0.08)] focus:border-[#1f1f1f] focus:outline-none focus:ring-4 focus:ring-[rgba(31,31,31,0.1)]"
        [class.border-[#ef4444]]="showError"
      >
        <option value="">{{ placeholder }}</option>
        @for (option of options; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
      <span class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
        <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </span>
      @if (showSuccess) {
        <span class="pointer-events-none absolute inset-y-0 right-10 flex items-center text-sm font-bold text-[#16a34a]">✓</span>
      }
    </div>
    @if (showError && errorMessage) {
      <p class="mt-2 text-xs font-medium text-[#ef4444]">{{ errorMessage }}</p>
    }
  `,
})
export class CustomSelectComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) inputId = '';
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() placeholder = 'Select option';
  @Input() options: OptionItem[] = [];
  @Input() showError = false;
  @Input() showSuccess = false;
  @Input() errorMessage = '';
}
