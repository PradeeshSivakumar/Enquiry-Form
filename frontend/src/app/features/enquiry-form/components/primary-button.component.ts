import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-primary-button',
  standalone: true,
  template: `
    <button
      type="submit"
      [disabled]="disabled"
      class="inline-flex h-[52px] items-center gap-2 rounded-xl bg-[#1f1f1f] px-9 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(31,31,31,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#3f3f46] disabled:cursor-not-allowed disabled:opacity-60"
    >
      @if (loading) {
        <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
      }
      <span>{{ loading ? 'Submitting...' : 'Submit Enquiry' }}</span>
    </button>
  `,
})
export class PrimaryButtonComponent {
  @Input() loading = false;
  @Input() disabled = false;
}
