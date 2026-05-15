import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <label [for]="inputId" class="mb-1 block text-sm font-medium text-slate-700">{{ label }}</label>
    <input
      [id]="inputId"
      [type]="type"
      [formControl]="control"
      [placeholder]="placeholder"
      class="w-full border-0 border-b border-[#cccccc] bg-transparent px-1 py-2 text-sm text-slate-900 outline-none transition hover:border-[#1f1f1f] focus:border-[#1f1f1f] focus:ring-0"
      [attr.aria-invalid]="showError"
    />
    @if (showError && errorMessage) {
      <p class="mt-1 text-xs text-[#e53e3e]">{{ errorMessage }}</p>
    }
  `,
})
export class FormInputComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) inputId = '';
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() showError = false;
  @Input() errorMessage = '';
}
