import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sidebar-brand',
  standalone: true,
  template: `
    <section class="flex flex-col items-center">
      <div
        class="group flex items-center justify-center overflow-hidden rounded-full bg-[#1f1f1f] p-3 shadow-[inset_0_3px_14px_rgba(255,255,255,0.08),0_10px_28px_rgba(31,31,31,0.22)] ring-8 ring-slate-100 transition duration-300 hover:scale-[1.03] hover:ring-[#d1d5db]"
        [style.width.px]="circleSize"
        [style.height.px]="circleSize"
      >
        <img [src]="'img/NTS_ROUND_LOGO.png'" alt="Niraltek logo" class="h-full w-full object-contain" loading="lazy" />
      </div>
      <p class="mt-4 text-center text-[1.02rem] leading-tight font-bold tracking-[0.2px] text-[#1f1f1f]">Niraltek Solutions Pvt Ltd</p>
      <p class="mt-3 text-center text-[0.82rem] font-semibold uppercase tracking-[0.22em] text-[#526173]">Enterprise IoT & Product Engineering</p>
    </section>
  `,
})
export class SidebarBrandComponent {
  @Input() circleSize = 128;
}
