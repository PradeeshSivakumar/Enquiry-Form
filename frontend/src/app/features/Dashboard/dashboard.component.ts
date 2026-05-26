import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { environment } from '../../../environments/environment';

Chart.register(...registerables);

interface CategoryDistribution {
  category: string;
  count: number;
}

interface DashboardStats {
  totalEnquiries: number;
  totalProducts: number;
  categoryDistribution: CategoryDistribution[];
}

interface RecentEnquiry {
  id: number;
  full_name: string;
  company_name: string | null;
  venue: string | null;
  lead_category: string | null;
  interests: string[];
  created_at: string;
}

interface MonthlyTrend {
  dateKey: string;
  date: string;
  count: number;
}

interface ProductDistribution {
  product: string;
  count: number;
}

interface VenueAnalytics {
  venue: string;
  city: string;
  count: number;
}

type StatKey = keyof DashboardStats;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/api/dashboard`;
  private counterTimer: ReturnType<typeof setInterval> | null = null;
  private readonly counterKeys: StatKey[] = ['totalEnquiries', 'totalProducts'];
  private trendChart: Chart<'line'> | null = null;
  private productChart: Chart<'doughnut'> | null = null;

  @ViewChild('trendCanvas') trendCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('productCanvas') productCanvas?: ElementRef<HTMLCanvasElement>;

  loading = signal(true);
  error = signal<string | null>(null);
  chartsReady = signal(false);
  trendRange = signal<7 | 30>(30);

  stats = signal<DashboardStats>({
    totalEnquiries: 0,
    totalProducts: 0,
    categoryDistribution: []
  });

  displayedStats = signal<DashboardStats>({
    totalEnquiries: 0,
    totalProducts: 0,
    categoryDistribution: []
  });

  recentEnquiries = signal<RecentEnquiry[]>([]);
  monthlyTrends = signal<MonthlyTrend[]>([]);
  productDistribution = signal<ProductDistribution[]>([]);
  venueAnalytics = signal<VenueAnalytics[]>([]);

  hasRecentEnquiries = computed(() => this.recentEnquiries().length > 0);
  hasProductDistribution = computed(() => this.productDistribution().some((item) => item.count > 0));
  maxVenueCount = computed(() => Math.max(1, ...this.venueAnalytics().map((item) => item.count)));

  statCards = computed(() => {
    const baseCards = [
      {
        label: 'TOTAL ENQUIRIES',
        value: this.displayedStats().totalEnquiries,
        accent: 'navy',
        icon: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Zm4 1.75h8M8 12h8M8 15.75h5'
      },
      {
        label: 'TOTAL PRODUCTS',
        value: this.displayedStats().totalProducts,
        accent: 'blue',
        icon: 'M12 2 3.5 6.75v10.5L12 22l8.5-4.75V6.75L12 2Zm0 2.3 4.25 2.38L12 9.05 7.75 6.68 12 4.3Zm-6.5 4.1 5.5 3.08v7.88l-5.5-3.08V8.4Zm13 7.88-5.5 3.08v-7.88l5.5-3.08v7.88Z'
      }
    ];

    // Add dynamic category cards (top 3 categories by count)
    const categoryCards = this.displayedStats().categoryDistribution
      .slice(0, 3)
      .map((cat, index) => ({
        label: cat.category.toUpperCase(),
        value: cat.count,
        accent: index === 0 ? 'green' : index === 1 ? 'amber' : 'purple',
        icon: 'M20 7 9 18l-5-5 1.75-1.75L9 14.5 18.25 5.25 20 7Z'
      }));

    return [...baseCards, ...categoryCards];
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.chartsReady.set(true);
    this.renderCharts();
  }

  ngOnDestroy(): void {
    if (this.counterTimer) {
      clearInterval(this.counterTimer);
    }
    this.trendChart?.destroy();
    this.productChart?.destroy();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.trendChart?.resize();
    this.productChart?.resize();
  }

  onTrendRangeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.trendRange.set(value === '7' ? 7 : 30);
    this.drawTrendChart();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      stats: this.http.get<DashboardStats>(`${this.apiUrl}/stats`),
      recent: this.http.get<RecentEnquiry[]>(`${this.apiUrl}/recent-enquiries`),
      trends: this.http.get<MonthlyTrend[]>(`${this.apiUrl}/monthly-trends`),
      products: this.http.get<ProductDistribution[]>(`${this.apiUrl}/product-distribution`),
      venues: this.http.get<VenueAnalytics[]>(`${this.apiUrl}/venue-analytics`)
    }).subscribe({
      next: (response) => {
        this.stats.set(this.normalizeStats(response.stats));
        this.recentEnquiries.set(response.recent.map((item) => ({
          ...item,
          interests: Array.isArray(item.interests) ? item.interests : []
        })));
        this.monthlyTrends.set(response.trends);
        this.productDistribution.set(response.products);
        this.venueAnalytics.set(this.prepareVenueAnalytics(response.venues));
        this.animateCounters(response.stats);
        this.loading.set(false);
        setTimeout(() => this.renderCharts(), 0);
      },
      error: (error) => {
        console.error('Dashboard loading failed', error);
        this.error.set('Unable to load dashboard analytics. Please try again.');
        this.loading.set(false);
      }
    });
  }

  formatProducts(interests: string[]): string {
    return interests.length ? interests.join(', ') : '-';
  }

  trackById(_: number, item: RecentEnquiry): number {
    return item.id;
  }

  trackByVenue(_: number, item: VenueAnalytics): string {
    return `${item.city}-${item.venue}`;
  }

  venueWidth(count: number): string {
    return `${Math.max(6, Math.round((count / this.maxVenueCount()) * 100))}%`;
  }

  private normalizeStats(stats: DashboardStats): DashboardStats {
    return {
      totalEnquiries: Number(stats.totalEnquiries || 0),
      totalProducts: Number(stats.totalProducts || 0),
      categoryDistribution: stats.categoryDistribution || []
    };
  }

  private animateCounters(targetStats: DashboardStats): void {
    if (this.counterTimer) {
      clearInterval(this.counterTimer);
    }

    const target = this.normalizeStats(targetStats);
    const duration = 750;
    const start = performance.now();

    this.counterTimer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);

      // Only animate numeric fields
      const next: DashboardStats = {
        totalEnquiries: Math.round(target.totalEnquiries * eased),
        totalProducts: Math.round(target.totalProducts * eased),
        categoryDistribution: target.categoryDistribution
      };

      this.displayedStats.set(next);

      if (progress >= 1 && this.counterTimer) {
        clearInterval(this.counterTimer);
        this.counterTimer = null;
        this.displayedStats.set(target);
      }
    }, 16);
  }

  private prepareVenueAnalytics(items: VenueAnalytics[]): VenueAnalytics[] {
    const requiredCities = ['Chennai', 'Bangalore', 'Coimbatore', 'Hyderabad'];
    const normalized = items.map((item) => ({
      venue: item.venue || item.city || 'Unknown',
      city: item.city || item.venue || 'Unknown',
      count: Number(item.count || 0)
    }));

    requiredCities.forEach((city) => {
      if (!normalized.some((item) => item.city.toLowerCase() === city.toLowerCase())) {
        normalized.push({ city, venue: city, count: 0 });
      }
    });

    return normalized.sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
  }

  private renderCharts(): void {
    if (!this.chartsReady()) {
      return;
    }

    this.drawTrendChart();
    this.drawProductChart();
  }

  private drawTrendChart(): void {
    const canvas = this.trendCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    let data = this.monthlyTrends();
    if (this.trendRange() === 7) {
      data = data.slice(-7);
    }

    const configuration: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: data.map((item) => item.date),
        datasets: [
          {
            label: 'Enquiries',
            data: data.map(item => item.count),
            borderColor: data.map((_, index) => {
              const colors = ['#081028', '#2563EB', '#10B981', '#F59E0B', '#7C3AED', '#0F766E', '#EF4444'];
              return colors[index % colors.length];
            }),
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(37,99,235,0.2)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#081028',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 12,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6B7280',
              font: {
                size: 11,
                weight: 600
              }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: '#6B7280',
              font: {
                size: 11,
                weight: 600
              }
            },
            grid: {
              color: '#F1F5F9' // Very crisp, clean grid color
            }
          }
        }
      }
    };

    this.trendChart?.destroy();
    this.trendChart = new Chart(canvas, configuration);
  }

  private drawProductChart(): void {
    const canvas = this.productCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    const data = this.productDistribution().filter((item) => item.count > 0);
    const colors = ['#081028', '#2563EB', '#10B981', '#F59E0B', '#7C3AED', '#EF4444', '#0F766E', '#64748B'];

    const configuration: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: data.map((item) => item.product),
        datasets: [
          {
            data: data.map((item) => item.count),
            backgroundColor: data.map((_, index) => colors[index % colors.length]),
            borderColor: '#ffffff',
            borderWidth: 4,
            hoverOffset: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '64%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 800
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#1F2937',
              boxWidth: 12,
              boxHeight: 12,
              padding: 16,
              font: {
                size: 12,
                weight: 600
              }
            }
          },
          tooltip: {
            backgroundColor: '#081028',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 12
          }
        }
      }
    };

    this.productChart?.destroy();
    this.productChart = new Chart(canvas, configuration);
  }
}
