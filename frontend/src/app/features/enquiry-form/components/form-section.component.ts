import { Component, Input } from '@angular/core';
import { SectionTitleComponent } from './section-title.component';

@Component({
  selector: 'app-form-section',
  standalone: true,
  imports: [SectionTitleComponent],
  host: {
    class: 'block',
  },
  template: `
    <section class="rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-300 hover:border-[#1f1f1f] hover:shadow-[0_0_0_4px_rgba(31,31,31,0.08),0_14px_34px_rgba(31,31,31,0.1)] sm:p-7">
      <app-section-title [title]="title" [icon]="icon" />
      <div class="mt-4 border-t border-slate-100 pt-4 sm:mt-6 sm:pt-6">
        <ng-content />
      </div>
    </section>
  `,
})
export class FormSectionComponent {
  @Input({ required: true }) title = '';
  @Input() icon: 'personal' | 'professional' | 'product' | 'attachment' | 'venue' = 'personal';
}
