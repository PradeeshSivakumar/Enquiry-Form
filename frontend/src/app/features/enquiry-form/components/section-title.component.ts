import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-title',
  standalone: true,
  template: `
    <div class="flex items-center gap-3">
      <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        @if (icon === 'personal') {
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-none stroke-current stroke-[2]"><path d="M20 21a8 8 0 10-16 0"/><circle cx="12" cy="7" r="4"/></svg>
        } @else if (icon === 'professional') {
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-none stroke-current stroke-[2]"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a4 4 0 018 0v2"/></svg>
        } @else if (icon === 'product') {
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-none stroke-current stroke-[2]"><path d="M12 2l8 4.5v11L12 22 4 17.5v-11L12 2z"/><path d="M12 22v-9.5M4 6.5l8 6 8-6"/></svg>
        } @else if (icon === 'attachment') {
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-none stroke-current stroke-[2]"><path d="M21 12.5l-8.5 8.5a5 5 0 01-7-7L14 5.5a3.5 3.5 0 115 5l-8.5 8.5a2 2 0 11-3-3L15 8.5"/></svg>
        } @else if (icon === 'venue') {
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-none stroke-current stroke-[2]"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        }
      </span>
      <h2 class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">{{ title }}</h2>
    </div>
  `,
})
export class SectionTitleComponent {
  @Input({ required: true }) title = '';
  @Input() icon: 'personal' | 'professional' | 'product' | 'attachment' | 'venue' = 'personal';
}
