import { Component, Input } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { OptionItem } from '../../../core/constants/form-options';

@Component({
  selector: 'app-checkbox-group',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <fieldset>
      <legend class="mb-2 text-sm font-medium text-slate-800">{{ label }}</legend>
      <div class="space-y-2">
        @for (option of options; track option.value; let i = $index) {
          <label class="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              [formControl]="controls.at(i)"
              class="h-4 w-4 rounded border-[#cccccc] text-[#1f1f1f] focus:ring-[#1f1f1f]"
            />
            <span>{{ option.label }}</span>
          </label>
        }
      </div>
      @if (showError && errorMessage) {
        <p class="mt-2 text-xs text-[#e53e3e]">{{ errorMessage }}</p>
      }
    </fieldset>
  `,
})
export class CheckboxGroupComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) options: OptionItem[] = [];
  @Input({ required: true }) controls!: FormArray<FormControl<boolean | null>>;
  @Input() showError = false;
  @Input() errorMessage = '';
}
