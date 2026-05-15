import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (floatingLabel) {
      <div class="mb-2 h-[23px]" aria-hidden="true"></div>
    } @else {
      <label [for]="inputId" class="mb-2 block text-[0.95rem] font-semibold text-slate-800">{{ label }}</label>
    }
    <div class="relative">
      <input
        [id]="inputId"
        [type]="type"
        [formControl]="control"
        [placeholder]="floatingLabel ? ' ' : placeholder"
        [attr.aria-invalid]="showError"
        class="peer h-[52px] w-full rounded-xl border border-[#d1d5db] bg-white px-4 text-sm text-slate-800 transition duration-200 placeholder:text-slate-400 hover:!border-[#1f1f1f] hover:shadow-[0_0_0_4px_rgba(31,31,31,0.08)] focus:border-[#1f1f1f] focus:outline-none focus:ring-4 focus:ring-[rgba(31,31,31,0.1)]"
        [class.border-[#ef4444]]="showError"
      />
      @if (floatingLabel) {
        <label
          [for]="inputId"
          class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 bg-white px-1 text-sm font-medium text-slate-500 transition-all duration-200 peer-focus:top-0 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-[#1f1f1f] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs"
        >
          {{ label }}
        </label>
      }
      @if (showSuccess) {
        <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#16a34a]">✓</span>
      }
    </div>
    @if (showError && errorMessage) {
      <p class="mt-2 text-xs font-medium text-[#ef4444]">{{ errorMessage }}</p>
    }
  `,
})
export class CustomInputComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) inputId = '';
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() showError = false;
  @Input() showSuccess = false;
  @Input() floatingLabel = true;
  @Input() errorMessage = '';
}
