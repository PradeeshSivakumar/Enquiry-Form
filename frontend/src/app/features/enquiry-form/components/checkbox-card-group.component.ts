import { Component, Input } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { OptionItem } from '../../../core/constants/form-options';

@Component({
  selector: 'app-checkbox-card-group',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <fieldset>
      <legend class="mb-3 text-[0.95rem] font-semibold text-slate-800">{{ label }}</legend>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        @for (option of options; track option.value; let i = $index) {
          <label
            class="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1f1f1f] hover:bg-slate-100 hover:shadow-md"
            [class.border-[#1f1f1f]]="controls.at(i).value"
            [class.bg-slate-100]="controls.at(i).value"
            [class.shadow-[0_8px_22px_rgba(31,31,31,0.16)]]="controls.at(i).value"
            [class.border-[#d1d5db]]="!controls.at(i).value"
          >
            <input type="checkbox" [formControl]="controls.at(i)" class="h-4 w-4 rounded border-[#d1d5db] text-[#1f1f1f] transition duration-200 focus:ring-[#1f1f1f]" />
            <span>{{ option.label }}</span>
          </label>
        }
      </div>
      @if (showError && errorMessage) {
        <p class="mt-2 text-xs font-medium text-[#ef4444]">{{ errorMessage }}</p>
      }
    </fieldset>
  `,
})
export class CheckboxCardGroupComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) options: OptionItem[] = [];
  @Input({ required: true }) controls!: FormArray<FormControl<boolean | null>>;
  @Input() showError = false;
  @Input() errorMessage = '';
}
