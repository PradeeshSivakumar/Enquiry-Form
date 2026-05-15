import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { OptionItem } from '../../../core/constants/form-options';

@Component({
  selector: 'app-form-dropdown',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <label [for]="inputId" class="mb-1 block text-sm font-medium text-slate-700">{{ label }}</label>
    <div class="relative">
      <select
        [id]="inputId"
        [formControl]="control"
        class="w-full appearance-none rounded-lg border border-[#cccccc] bg-white px-3 py-2 pr-9 text-sm text-slate-900 transition hover:border-[#1f1f1f] focus:border-[#1f1f1f] focus:outline-none"
        [attr.aria-invalid]="showError"
      >
        <option value="">{{ placeholder }}</option>
        @for (option of options; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
      <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">v</span>
    </div>
    @if (showError && errorMessage) {
      <p class="mt-1 text-xs text-[#e53e3e]">{{ errorMessage }}</p>
    }
  `,
})
export class FormDropdownComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) inputId = '';
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() placeholder = 'Select option';
  @Input() options: OptionItem[] = [];
  @Input() showError = false;
  @Input() errorMessage = '';
}
