import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <label [for]="inputId" class="mb-2 block text-[0.95rem] font-semibold text-slate-800">{{ label }}</label>
    <textarea
      [id]="inputId"
      [formControl]="control"
      [rows]="rows"
      [placeholder]="placeholder"
      class="min-h-[140px] w-full resize-y rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition duration-200 hover:border-[#1f1f1f] hover:shadow-[0_0_0_4px_rgba(31,31,31,0.08)] focus:border-[#1f1f1f] focus:outline-none focus:ring-4 focus:ring-[rgba(31,31,31,0.1)]"
    ></textarea>
    @if (hint) {
      <p class="mt-2 text-xs text-slate-500">{{ hint }}</p>
    }
  `,
})
export class TextareaComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) inputId = '';
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() rows = 4;
  @Input() placeholder = '';
  @Input() hint = '';
}
