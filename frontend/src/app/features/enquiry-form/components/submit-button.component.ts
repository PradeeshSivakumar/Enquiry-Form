import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-submit-button',
  standalone: true,
  template: `
    <button
      type="submit"
      [disabled]="disabled"
      class="inline-flex items-center gap-2 rounded-lg bg-[#1f1f1f] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#3f3f46] disabled:cursor-not-allowed disabled:opacity-60"
    >
      @if (loading) {
        <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
      }
      <span>{{ loading ? 'Submitting...' : 'Submit' }}</span>
    </button>
  `,
})
export class SubmitButtonComponent {
  @Input() loading = false;
  @Input() disabled = false;
}
