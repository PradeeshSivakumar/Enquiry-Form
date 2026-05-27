import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmailCampaignsService, Campaign, CampaignTemplate, CampaignRecipient, CampaignDetails } from '../../services/email-campaigns.service';
import { Visitor, VisitorsService } from '../../../visitors/services/visitors.service';
import { PaginationComponent } from '../../../../shared/pagination/pagination.component';
import { PermissionService } from '../../../../core/permissions/permission.service';
import { VenueService, Venue } from '../../../venue/services/venue.service';
import { ProductsService } from '../../../products/services/products.service';
import { DepartmentService } from '../../../department/services/department.service';
import { LeadCategoryService } from '../../../lead-category/services/lead-category.service';

@Component({
  selector: 'app-email-campaigns-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './email-campaigns-page.component.html',
  styleUrl: './email-campaigns-page.component.css'
})
export class EmailCampaignsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private campaignsService = inject(EmailCampaignsService);
  private visitorsService = inject(VisitorsService);
  private permissionService = inject(PermissionService);
  private fb = inject(FormBuilder);
  private venueService = inject(VenueService);
  private productsService = inject(ProductsService);
  private departmentService = inject(DepartmentService);
  private leadCategoryService = inject(LeadCategoryService);
  Math = Math;

  // Security checks mapped to module permissions
  get canView() { return this.permissionService.canView('email_campaigns'); }
  get canAdd() { return this.permissionService.canAdd('email_campaigns'); }
  get canEdit() { return this.permissionService.canEdit('email_campaigns'); }
  get canExport() { return this.permissionService.canExport('email_campaigns'); }

  // Active Tab
  activeTab = signal<'dashboard' | 'campaigns' | 'templates'>('dashboard');
  
  // Manager Sub-Tabs (Sent, Scheduled, Drafts)
  managerTab = signal<'sent' | 'scheduled' | 'drafts'>('sent');

  // Dashboard signals
  totalCampaigns = signal<number>(0);
  totalSent = signal<number>(0);
  totalFailed = signal<number>(0);
  openRate = signal<number>(0);
  recentCampaigns = signal<Campaign[]>([]);

  // Expanded Dashboard Signals (Analytical)
  totalDrafts = signal<number>(0);
  totalScheduled = signal<number>(0);
  totalFailedCampaigns = signal<number>(0);
  pendingTriggers = signal<number>(0);
  sentToday = signal<number>(0);

  // Campaigns list signals (Sent/Completed)
  campaigns = signal<Campaign[]>([]);
  totalCampaignsCount = signal<number>(0);
  campaignsLoading = signal<boolean>(false);

  // Scheduled list signals
  scheduled = signal<Campaign[]>([]);
  totalScheduledCount = signal<number>(0);
  scheduledLoading = signal<boolean>(false);

  // Drafts list signals
  drafts = signal<Campaign[]>([]);
  totalDraftsCount = signal<number>(0);
  draftsLoading = signal<boolean>(false);

  // Pagination & Search Shared State
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  sortKey = signal<string>('created_at');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  // Templates signals
  templates = signal<CampaignTemplate[]>([]);
  templatesLoading = signal<boolean>(false);

  // Modal signals
  composerOpen = signal<boolean>(false);
  detailsModalOpen = signal<boolean>(false);
  templateModalOpen = signal<boolean>(false);
  deleteTemplateModalOpen = signal<boolean>(false);

  // Edit State
  isEditing = signal<boolean>(false);
  editingCampaignId = signal<number | null>(null);
  editingCampaignStatus = signal<string | null>(null);

  // Campaign Preview signals
  previewModalOpen = signal<boolean>(false);
  previewCampaign = signal<Campaign | null>(null);
  previewDevice = signal<'desktop' | 'mobile'>('desktop');
  previewRecipientsList = signal<Visitor[]>([]);

  // Reschedule dialog states
  rescheduleModalOpen = signal<boolean>(false);
  rescheduleCampaign = signal<Campaign | null>(null);
  rescheduleDate = signal<string>('');
  rescheduleTime = signal<string>('');
  rescheduleTimezone = signal<string>('IST');

  // Confirmation Modal
  confirmModalOpen = signal<boolean>(false);
  confirmAction = signal<'send_now' | 'trigger_schedule' | 'delete' | 'pause' | 'resume'>('send_now');
  confirmCampaign = signal<Campaign | null>(null);

  // Selected entities for modals
  selectedCampaign = signal<CampaignDetails | null>(null);
  selectedTemplate = signal<CampaignTemplate | null>(null);

  // Filter options lists
  venues = signal<Venue[]>([]);
  activeProducts = signal<string[]>([]);
  departments = signal<string[]>([]);
  leadCategories = signal<string[]>([]);

  // Filter selection signals
  recipientFromDate = signal<string>('');
  recipientToDate = signal<string>('');
  recipientDepartment = signal<string>('');
  recipientProduct = signal<string>('');
  recipientCategory = signal<string>('');
  recipientVenue = signal<string>('');
  recipientDropdownSearch = signal<string>('');

  // Dropdown control signals
  recipientDropdownOpen = signal<boolean>(false);
  filteredRecipients = signal<Visitor[]>([]);
  totalMatchingRecipients = signal<number>(0);
  recipientsLoading = signal<boolean>(false);

  displayedRecipients = computed(() => {
    const searchVal = this.recipientDropdownSearch().toLowerCase().trim();
    const list = this.filteredRecipients();
    if (!searchVal) return list;
    return list.filter(v => 
      (v.full_name?.toLowerCase().includes(searchVal)) ||
      (v.company_name?.toLowerCase().includes(searchVal)) ||
      (v.email?.toLowerCase().includes(searchVal))
    );
  });

  // All available visitors for selection
  allVisitors = signal<Visitor[]>([]);
  selectedRecipients = signal<Visitor[]>([]);
  visitorsLoading = signal<boolean>(false);

  // Forms
  composerForm!: FormGroup;
  templateForm!: FormGroup;
  isSubmitting = signal<boolean>(false);

  // Toast Notification
  toastMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  private toastTimeout: any;

  @ViewChild('bodyTextarea') bodyTextarea!: ElementRef<HTMLTextAreaElement>;

  ngOnInit() {
    this.initForms();
    if (this.canView) {
      this.loadDashboardData();
      this.loadTemplates();
      this.loadVisitors();
      this.loadFilterOptions();
    }
  }

  initForms() {
    this.composerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      templateId: [null],
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      body: ['', [Validators.required]],
      senderName: ['Enterprise Admin', [Validators.required, Validators.maxLength(100)]],
      replyEmail: ['admin@enterprise.com', [Validators.required, Validators.email]],
      sendMode: ['now', [Validators.required]],
      scheduleDate: [''],
      scheduleTime: [''],
      scheduleTimezone: ['IST']
    });

    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      body: ['', [Validators.required]]
    });
  }

  showToast(text: string, type: 'success' | 'error' = 'success') {
    this.toastMessage.set({ text, type });
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toastMessage.set(null), 3000);
  }

  // Dashboard Data Loader
  loadDashboardData() {
    this.campaignsService.getDashboard().subscribe({
      next: (data) => {
        this.totalCampaigns.set(data.totalCampaigns);
        this.totalSent.set(data.totalSent);
        this.totalFailed.set(data.totalFailed);
        this.openRate.set(data.openRate);
        this.recentCampaigns.set(data.recentCampaigns);
        this.totalDrafts.set(data.totalDrafts || 0);
        this.totalScheduled.set(data.totalScheduled || 0);
        this.totalFailedCampaigns.set(data.totalFailedCampaigns || 0);
        this.pendingTriggers.set(data.pendingTriggers || 0);
        this.sentToday.set(data.sentToday || 0);
      },
      error: (err) => {
        console.error('Failed to load dashboard', err);
        this.showToast('Failed to load dashboard metrics', 'error');
      }
    });
  }

  // Campaigns list query by status
  loadManagerCampaigns() {
    const tab = this.managerTab();
    if (tab === 'sent') {
      this.loadCampaignsByStatus('Sent');
    } else if (tab === 'scheduled') {
      this.loadCampaignsByStatus('Scheduled');
    } else if (tab === 'drafts') {
      this.loadCampaignsByStatus('Draft');
    }
  }

  loadCampaignsByStatus(status: string) {
    const tab = this.managerTab();
    if (tab === 'sent') this.campaignsLoading.set(true);
    else if (tab === 'scheduled') this.scheduledLoading.set(true);
    else if (tab === 'drafts') this.draftsLoading.set(true);

    const offset = (this.currentPage() - 1) * this.pageSize();
    this.campaignsService.getCampaigns(
      this.searchQuery(),
      this.pageSize(),
      offset,
      this.sortKey(),
      this.sortDirection(),
      status
    ).subscribe({
      next: (res) => {
        if (tab === 'sent') {
          this.campaigns.set(res.campaigns);
          this.totalCampaignsCount.set(res.total);
          this.campaignsLoading.set(false);
        } else if (tab === 'scheduled') {
          this.scheduled.set(res.campaigns);
          this.totalScheduledCount.set(res.total);
          this.scheduledLoading.set(false);
        } else if (tab === 'drafts') {
          this.drafts.set(res.campaigns);
          this.totalDraftsCount.set(res.total);
          this.draftsLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load campaigns list', err);
        this.showToast('Failed to load campaign records', 'error');
        this.campaignsLoading.set(false);
        this.scheduledLoading.set(false);
        this.draftsLoading.set(false);
      }
    });
  }

  // Load Templates CRUD list
  loadTemplates() {
    this.templatesLoading.set(true);
    this.campaignsService.getTemplates().subscribe({
      next: (data) => {
        this.templates.set(data);
        this.templatesLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load templates', err);
        this.showToast('Failed to load templates list', 'error');
        this.templatesLoading.set(false);
      }
    });
  }

  // Load all visitors for the recipient multi-selector dropdown
  loadVisitors() {
    this.visitorsLoading.set(true);
    this.visitorsService.getVisitors().subscribe({
      next: (data) => {
        const initialized = data.map(v => ({
          ...v,
          alternate_mobile: v.alternate_mobile || null,
          office_number: v.office_number || null,
          lead_category: v.lead_category || null
        }));
        this.allVisitors.set(initialized);
        this.visitorsLoading.set(false);
        this.checkQueryParameters();
      },
      error: (err) => {
        console.error('Failed to load visitors', err);
        this.allVisitors.set([]);
        this.visitorsLoading.set(false);
      }
    });
  }

  // Read query params from route (visitors directory bulk trigger)
  checkQueryParameters() {
    this.route.queryParams.subscribe(params => {
      const visitorIdsStr = params['visitorIds'];
      if (visitorIdsStr) {
        const ids = visitorIdsStr.split(',').map(Number).filter((id: number) => !isNaN(id));
        if (ids.length > 0) {
          const selected = this.allVisitors().filter(v => ids.includes(v.id));
          this.selectedRecipients.set(selected);
          
          if (selected.length > 0) {
            this.openComposer();
            this.showToast(`Pre-loaded ${selected.length} recipients.`, 'success');
          }
        }
        
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { visitorIds: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
    });
  }

  // Tab switcher
  switchTab(tab: 'dashboard' | 'campaigns' | 'templates') {
    this.activeTab.set(tab);
    if (tab === 'campaigns') {
      this.currentPage.set(1);
      this.loadManagerCampaigns();
    } else if (tab === 'templates') {
      this.loadTemplates();
    } else if (tab === 'dashboard') {
      this.loadDashboardData();
    }
  }

  switchManagerTab(tab: 'sent' | 'scheduled' | 'drafts') {
    this.managerTab.set(tab);
    this.currentPage.set(1);
    this.loadManagerCampaigns();
  }

  // Campaign pagination & sorting
  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
    this.loadManagerCampaigns();
  }

  sortBy(key: string) {
    if (this.sortKey() === key) {
      this.sortDirection.update(dir => dir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('ASC');
    }
    this.currentPage.set(1);
    this.loadManagerCampaigns();
  }

  sortIndicator(key: string): string {
    if (this.sortKey() !== key) return '↕';
    return this.sortDirection() === 'ASC' ? '↑' : '↓';
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadManagerCampaigns();
  }

  totalItemsForCurrentTab = computed(() => {
    const tab = this.managerTab();
    if (tab === 'sent') return this.totalCampaignsCount();
    if (tab === 'scheduled') return this.totalScheduledCount();
    return this.totalDraftsCount();
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.totalItemsForCurrentTab() / this.pageSize()));
  });

  // Modals operations
  openComposer(editingCampaign: Campaign | null = null) {
    if (!this.canAdd) {
      this.showToast('Access denied: You do not have permission to write campaigns.', 'error');
      return;
    }
    this.composerForm.reset();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (editingCampaign) {
      this.isEditing.set(true);
      this.editingCampaignId.set(editingCampaign.id);
      this.editingCampaignStatus.set(editingCampaign.status || null);

      // Parse recipient IDs from string
      let ids: number[] = [];
      if (editingCampaign.recipient_ids) {
        try {
          ids = JSON.parse(editingCampaign.recipient_ids);
        } catch (e) {
          ids = editingCampaign.recipient_ids.split(',').map(Number).filter(n => !isNaN(n));
        }
      }
      const selected = this.allVisitors().filter(v => ids.includes(v.id));
      this.selectedRecipients.set(selected);

      // Format date/time
      let dateVal = tomorrowStr;
      let timeVal = '10:00';
      if (editingCampaign.scheduled_at) {
        try {
          const d = new Date(editingCampaign.scheduled_at);
          dateVal = d.toISOString().split('T')[0];
          timeVal = d.toTimeString().slice(0, 5);
        } catch(e) {}
      }

      this.composerForm.patchValue({
        name: editingCampaign.name,
        templateId: editingCampaign.template_id,
        subject: editingCampaign.subject,
        body: editingCampaign.body,
        senderName: 'Enterprise Admin',
        replyEmail: 'admin@enterprise.com',
        sendMode: editingCampaign.status === 'Scheduled' ? 'later' : 'now',
        scheduleDate: dateVal,
        scheduleTime: timeVal,
        scheduleTimezone: editingCampaign.timezone || 'IST'
      });

    } else {
      this.isEditing.set(false);
      this.editingCampaignId.set(null);
      this.selectedRecipients.set([]);

      this.composerForm.patchValue({
        name: `Email Campaign - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        senderName: 'Enterprise Admin',
        replyEmail: 'admin@enterprise.com',
        sendMode: 'now',
        scheduleDate: tomorrowStr,
        scheduleTime: '10:00',
        scheduleTimezone: 'IST'
      });
    }

    // Reset filters and dropdown
    this.recipientFromDate.set('');
    this.recipientToDate.set('');
    this.recipientDepartment.set('');
    this.recipientProduct.set('');
    this.recipientCategory.set('');
    this.recipientVenue.set('');
    this.recipientDropdownSearch.set('');
    this.recipientDropdownOpen.set(false);
    
    this.loadFilteredRecipients();
    this.composerOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeComposer() {
    this.composerOpen.set(false);
    this.selectedRecipients.set([]);
    this.isEditing.set(false);
    this.editingCampaignId.set(null);
    this.editingCampaignStatus.set(null);
    document.body.style.overflow = 'auto';
  }

  openCampaignDetails(campaign: Campaign) {
    this.campaignsService.getCampaignById(campaign.id).subscribe({
      next: (details) => {
        this.selectedCampaign.set(details);
        this.detailsModalOpen.set(true);
        document.body.style.overflow = 'hidden';
      },
      error: (err) => {
        console.error('Failed to load campaign details', err);
        this.showToast(err.error?.message || 'Failed to load campaign details', 'error');
      }
    });
  }

  closeCampaignDetails() {
    this.detailsModalOpen.set(false);
    this.selectedCampaign.set(null);
    document.body.style.overflow = 'auto';
  }

  // Previews modal
  openCampaignPreview(campaign: Campaign) {
    this.previewCampaign.set(campaign);
    this.previewDevice.set('desktop');

    let ids: number[] = [];
    if (campaign.recipient_ids) {
      try {
        ids = JSON.parse(campaign.recipient_ids);
      } catch (e) {
        ids = campaign.recipient_ids.split(',').map(Number).filter(n => !isNaN(n));
      }
    }
    const resolved = this.allVisitors().filter(v => ids.includes(v.id));
    this.previewRecipientsList.set(resolved);

    this.previewModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeCampaignPreview() {
    this.previewModalOpen.set(false);
    this.previewCampaign.set(null);
    this.previewRecipientsList.set([]);
    document.body.style.overflow = 'auto';
  }

  // Template Modal
  openTemplateModal(template: CampaignTemplate | null = null) {
    if (!this.canEdit) {
      this.showToast('Access denied: You do not have permission to manage templates.', 'error');
      return;
    }
    this.templateForm.reset();
    if (template) {
      this.selectedTemplate.set(template);
      this.templateForm.patchValue({
        name: template.name,
        subject: template.subject,
        body: template.body
      });
    } else {
      this.selectedTemplate.set(null);
    }
    this.templateModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeTemplateModal() {
    this.templateModalOpen.set(false);
    this.selectedTemplate.set(null);
    document.body.style.overflow = 'auto';
  }

  openDeleteTemplateModal(template: CampaignTemplate) {
    if (!this.canEdit) {
      this.showToast('Access denied: You do not have permission to manage templates.', 'error');
      return;
    }
    this.selectedTemplate.set(template);
    this.deleteTemplateModalOpen.set(true);
  }

  closeDeleteTemplateModal() {
    this.deleteTemplateModalOpen.set(false);
    this.selectedTemplate.set(null);
  }

  // Reschedule schedule modal
  openRescheduleModal(campaign: Campaign, event: Event) {
    event.stopPropagation();
    this.rescheduleCampaign.set(campaign);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let dateStr = tomorrow.toISOString().split('T')[0];
    let timeStr = '10:00';

    if (campaign.scheduled_at) {
      try {
        const d = new Date(campaign.scheduled_at);
        dateStr = d.toISOString().split('T')[0];
        timeStr = d.toTimeString().slice(0, 5);
      } catch(e) {}
    }

    this.rescheduleDate.set(dateStr);
    this.rescheduleTime.set(timeStr);
    this.rescheduleTimezone.set(campaign.timezone || 'IST');
    this.rescheduleModalOpen.set(true);
  }

  closeRescheduleModal() {
    this.rescheduleModalOpen.set(false);
    this.rescheduleCampaign.set(null);
  }

  saveReschedule() {
    const campaign = this.rescheduleCampaign();
    if (!campaign) return;
    this.isSubmitting.set(true);

    this.campaignsService.resumeCampaign(campaign.id, {
      scheduleDate: this.rescheduleDate(),
      scheduleTime: this.rescheduleTime(),
      timezone: this.rescheduleTimezone()
    }).subscribe({
      next: () => {
        this.showToast('Campaign rescheduled successfully!', 'success');
        this.isSubmitting.set(false);
        this.closeRescheduleModal();
        this.loadManagerCampaigns();
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Failed to reschedule campaign', err);
        this.showToast('Failed to reschedule campaign', 'error');
        this.isSubmitting.set(false);
      }
    });
  }

  // Confirmation Modals
  openConfirmModal(action: 'send_now' | 'trigger_schedule' | 'delete' | 'pause' | 'resume', campaign: Campaign, event: Event) {
    event.stopPropagation();
    this.confirmAction.set(action);
    this.confirmCampaign.set(campaign);
    this.confirmModalOpen.set(true);
  }

  closeConfirmModal() {
    this.confirmModalOpen.set(false);
    this.confirmCampaign.set(null);
  }

  executeConfirmAction() {
    const campaign = this.confirmCampaign();
    if (!campaign) return;
    this.isSubmitting.set(true);

    if (this.confirmAction() === 'send_now' || this.confirmAction() === 'trigger_schedule') {
      this.campaignsService.triggerCampaign(campaign.id).subscribe({
        next: () => {
          this.showToast('Campaign manual trigger started successfully!', 'success');
          this.isSubmitting.set(false);
          this.closeConfirmModal();
          // Switch to Sent tab to monitor
          this.switchManagerTab('sent');
          this.loadDashboardData();
        },
        error: (err) => {
          console.error('Failed to trigger campaign', err);
          this.showToast(err.error?.message || 'Failed to trigger campaign delivery', 'error');
          this.isSubmitting.set(false);
        }
      });
    } else if (this.confirmAction() === 'pause') {
      this.campaignsService.pauseCampaign(campaign.id).subscribe({
        next: () => {
          this.showToast('Campaign schedule paused/cancelled.', 'success');
          this.isSubmitting.set(false);
          this.closeConfirmModal();
          this.loadManagerCampaigns();
          this.loadDashboardData();
        },
        error: (err) => {
          console.error('Failed to pause campaign', err);
          this.showToast('Failed to pause campaign schedule', 'error');
          this.isSubmitting.set(false);
        }
      });
    } else if (this.confirmAction() === 'delete') {
      this.campaignsService.deleteCampaign(campaign.id).subscribe({
        next: () => {
          this.showToast('Campaign deleted successfully.', 'success');
          this.isSubmitting.set(false);
          this.closeConfirmModal();
          this.loadManagerCampaigns();
          this.loadDashboardData();
        },
        error: (err) => {
          console.error('Failed to delete campaign', err);
          this.showToast('Failed to delete campaign record', 'error');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  toggleRecipientDropdown(event: Event) {
    event.stopPropagation();
    this.recipientDropdownOpen.update(o => !o);
  }

  closeRecipientDropdown() {
    this.recipientDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.recipient-dropdown-container')) {
      this.closeRecipientDropdown();
    }
  }

  onRecipientDropdownSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.recipientDropdownSearch.set(input.value);
  }

  onRecipientFromDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.recipientFromDate.set(input.value);
    this.loadFilteredRecipients();
  }

  onRecipientToDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.recipientToDate.set(input.value);
    this.loadFilteredRecipients();
  }

  onRecipientDepartmentChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.recipientDepartment.set(select.value);
    this.loadFilteredRecipients();
  }

  onRecipientProductChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.recipientProduct.set(select.value);
    this.loadFilteredRecipients();
  }

  onRecipientCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.recipientCategory.set(select.value);
    this.loadFilteredRecipients();
  }

  onRecipientVenueChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.recipientVenue.set(select.value);
    this.loadFilteredRecipients();
  }

  clearRecipientFilters() {
    this.recipientFromDate.set('');
    this.recipientToDate.set('');
    this.recipientDepartment.set('');
    this.recipientProduct.set('');
    this.recipientCategory.set('');
    this.recipientVenue.set('');
    this.recipientDropdownSearch.set('');
    this.loadFilteredRecipients();
  }

  loadFilterOptions() {
    this.venueService.getVenues().subscribe({
      next: (data) => this.venues.set(data),
      error: (err) => console.error('Error fetching venues', err)
    });

    this.productsService.getActiveProducts().subscribe({
      next: (data) => this.activeProducts.set(data.map(p => p.name)),
      error: (err) => console.error('Error fetching products', err)
    });

    this.departmentService.getActiveDepartments().subscribe({
      next: (data) => this.departments.set(data.map(d => d.name)),
      error: (err) => console.error('Error loading departments', err)
    });

    this.leadCategoryService.getActiveLeadCategories().subscribe({
      next: (data) => this.leadCategories.set(data.map(c => c.name)),
      error: (err) => console.error('Error loading categories', err)
    });
  }

  loadFilteredRecipients() {
    this.recipientsLoading.set(true);
    this.visitorsService.getFilteredVisitors({
      fromDate: this.recipientFromDate(),
      toDate: this.recipientToDate(),
      department: this.recipientDepartment(),
      product: this.recipientProduct(),
      category: this.recipientCategory(),
      venue: this.recipientVenue(),
      search: '', 
      limit: 1000,
      offset: 0
    }).subscribe({
      next: (res) => {
        this.filteredRecipients.set(res.visitors);
        this.totalMatchingRecipients.set(res.total);
        this.recipientsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load filtered recipients', err);
        this.filteredRecipients.set([]);
        this.totalMatchingRecipients.set(0);
        this.recipientsLoading.set(false);
      }
    });
  }

  selectAllMatching() {
    const matching = this.filteredRecipients();
    this.selectedRecipients.update(selected => {
      const merged = [...selected];
      matching.forEach(visitor => {
        if (!merged.some(v => v.id === visitor.id)) {
          merged.push(visitor);
        }
      });
      return merged;
    });
    this.showToast(`Selected all ${matching.length} matching recipients`, 'success');
  }

  toggleRecipient(visitor: Visitor) {
    this.selectedRecipients.update(list => {
      const index = list.findIndex(r => r.id === visitor.id);
      if (index > -1) {
        return list.filter(r => r.id !== visitor.id);
      } else {
        return [...list, visitor];
      }
    });
  }

  isRecipientSelected(visitor: Visitor): boolean {
    return this.selectedRecipients().some(r => r.id === visitor.id);
  }

  clearAllRecipients() {
    this.selectedRecipients.set([]);
  }

  onComposerTemplateChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const templateId = select.value ? Number(select.value) : null;
    if (templateId) {
      const template = this.templates().find(t => t.id === templateId);
      if (template) {
        this.composerForm.patchValue({
          subject: template.subject,
          body: template.body
        });
        this.showToast(`Loaded template: "${template.name}"`, 'success');
      }
    }
  }

  insertPlaceholder(placeholder: string) {
    const textarea = this.bodyTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value || '';
    
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newValue = before + placeholder + after;

    this.composerForm.patchValue({ body: newValue });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
    });
  }

  // Scheduling Summary formatting
  getScheduledSummary(): string {
    const date = this.composerForm?.get('scheduleDate')?.value;
    const time = this.composerForm?.get('scheduleTime')?.value;
    const tz = this.composerForm?.get('scheduleTimezone')?.value || 'IST';
    if (!date || !time) return 'Not scheduled';
    return this.formatDateSummary(date, time, tz);
  }

  formatDateSummary(dateStr: string, timeStr: string, tz: string): string {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      const formattedDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${formattedDate} • ${timeStr} ${tz}`;
    } catch (e) {
      return `${dateStr} • ${timeStr} ${tz}`;
    }
  }

  formatTimestampToSummary(timestampStr: string | undefined, tz: string | undefined): string {
    if (!timestampStr) return '-';
    try {
      const d = new Date(timestampStr);
      const dateVal = d.toISOString().split('T')[0];
      const timeVal = d.toTimeString().slice(0, 5);
      return this.formatDateSummary(dateVal, timeVal, tz || 'IST');
    } catch(e) {
      return timestampStr;
    }
  }

  // Save Campaign as Draft
  saveDraft() {
    if (this.composerForm.get('name')?.invalid || this.composerForm.get('subject')?.invalid || this.composerForm.get('body')?.invalid) {
      this.composerForm.markAllAsTouched();
      this.showToast('Please correct form validation errors to save a draft.', 'error');
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.composerForm.value;
    const visitorIds = this.selectedRecipients().map(r => r.id);

    const payload = {
      name: formVal.name,
      subject: formVal.subject,
      body: formVal.body,
      templateId: formVal.templateId ? Number(formVal.templateId) : null,
      visitorIds,
      status: 'Draft'
    };

    if (this.isEditing() && this.editingCampaignId()) {
      this.campaignsService.updateCampaign(this.editingCampaignId()!, payload).subscribe({
        next: () => {
          this.showToast('Draft campaign updated successfully!', 'success');
          this.isSubmitting.set(false);
          this.closeComposer();
          this.switchManagerTab('drafts');
          this.loadDashboardData();
        },
        error: (err) => {
          console.error('Failed to update draft', err);
          this.showToast('Failed to save draft update.', 'error');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.campaignsService.createCampaign(payload).subscribe({
        next: () => {
          this.showToast('Draft campaign saved successfully!', 'success');
          this.isSubmitting.set(false);
          this.closeComposer();
          this.switchManagerTab('drafts');
          this.loadDashboardData();
        },
        error: (err) => {
          console.error('Failed to save draft', err);
          this.showToast('Failed to save draft.', 'error');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  // Submit operations (Send Now or Schedule)
  sendCampaign() {
    if (this.composerForm.get('name')?.invalid || 
        this.composerForm.get('subject')?.invalid || 
        this.composerForm.get('body')?.invalid || 
        this.composerForm.get('senderName')?.invalid || 
        this.composerForm.get('replyEmail')?.invalid) {
      this.composerForm.markAllAsTouched();
      this.showToast('Please correct form validation errors.', 'error');
      return;
    }

    const sendMode = this.composerForm.get('sendMode')?.value;
    if (sendMode === 'later') {
      const date = this.composerForm.get('scheduleDate')?.value;
      const time = this.composerForm.get('scheduleTime')?.value;
      if (!date || !time) {
        this.showToast('Please specify a date and time for scheduling.', 'error');
        return;
      }
    }

    const visitorIds = this.selectedRecipients().map(r => r.id);
    if (visitorIds.length === 0) {
      this.showToast('Please select at least one recipient.', 'error');
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.composerForm.value;

    if (sendMode === 'later') {
      const payload = {
        name: formVal.name,
        subject: formVal.subject,
        body: formVal.body,
        templateId: formVal.templateId ? Number(formVal.templateId) : null,
        visitorIds,
        status: 'Scheduled',
        scheduleDate: formVal.scheduleDate,
        scheduleTime: formVal.scheduleTime,
        timezone: formVal.scheduleTimezone
      };

      if (this.isEditing() && this.editingCampaignId()) {
        this.campaignsService.updateCampaign(this.editingCampaignId()!, payload).subscribe({
          next: () => {
            this.showToast(`Campaign rescheduled successfully for ${this.getScheduledSummary()}!`, 'success');
            this.isSubmitting.set(false);
            this.closeComposer();
            this.switchManagerTab('scheduled');
            this.loadDashboardData();
          },
          error: (err) => {
            console.error('Failed to reschedule campaign', err);
            this.showToast('Failed to schedule campaign.', 'error');
            this.isSubmitting.set(false);
          }
        });
      } else {
        this.campaignsService.createCampaign(payload).subscribe({
          next: () => {
            this.showToast(`Campaign scheduled successfully for ${this.getScheduledSummary()}!`, 'success');
            this.isSubmitting.set(false);
            this.closeComposer();
            this.switchManagerTab('scheduled');
            this.loadDashboardData();
          },
          error: (err) => {
            console.error('Failed to create scheduled campaign', err);
            this.showToast('Failed to schedule campaign.', 'error');
            this.isSubmitting.set(false);
          }
        });
      }

    } else {
      // Send Now immediately
      this.campaignsService.sendCampaign({
        name: formVal.name,
        subject: formVal.subject,
        body: formVal.body,
        templateId: formVal.templateId ? Number(formVal.templateId) : null,
        visitorIds
      }).subscribe({
        next: (res) => {
          this.showToast(`Campaign dispatch triggered successfully!`, 'success');
          this.isSubmitting.set(false);
          this.closeComposer();
          this.switchManagerTab('sent');
          this.loadDashboardData();
        },
        error: (err) => {
          console.error('Failed to send campaign', err);
          this.showToast(err.error?.message || 'Failed to trigger campaign delivery', 'error');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  // Save/Update template
  saveTemplate() {
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      this.showToast('Please correct form validation errors.', 'error');
      return;
    }

    this.isSubmitting.set(true);
    const data = this.templateForm.value;
    const editing = this.selectedTemplate();

    if (editing && editing.id) {
      this.campaignsService.updateTemplate(editing.id, data).subscribe({
        next: () => {
          this.showToast('Template updated successfully', 'success');
          this.isSubmitting.set(false);
          this.closeTemplateModal();
          this.loadTemplates();
        },
        error: (err) => {
          console.error('Failed to update template', err);
          this.showToast('Failed to save template', 'error');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.campaignsService.createTemplate(data).subscribe({
        next: () => {
          this.showToast('Template created successfully', 'success');
          this.isSubmitting.set(false);
          this.closeTemplateModal();
          this.loadTemplates();
        },
        error: (err) => {
          console.error('Failed to create template', err);
          this.showToast('Failed to create template', 'error');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  // Delete Template
  deleteTemplate() {
    const template = this.selectedTemplate();
    if (!template || !template.id) return;

    this.isSubmitting.set(true);
    this.campaignsService.deleteTemplate(template.id).subscribe({
      next: () => {
        this.showToast('Template deleted successfully', 'success');
        this.isSubmitting.set(false);
        this.closeDeleteTemplateModal();
        this.loadTemplates();
      },
      error: (err) => {
        console.error('Failed to delete template', err);
        this.showToast('Failed to delete template (It may be referenced by campaigns)', 'error');
        this.isSubmitting.set(false);
      }
    });
  }

  // CSV Campaign Report Export
  exportCampaignReport(campaign: CampaignDetails) {
    if (!this.canExport) {
      this.showToast('Access denied: You do not have permission to export campaign reports.', 'error');
      return;
    }
    const headers = ['Recipient Name', 'Email Address', 'Delivery Status', 'Sent Date', 'Opened Date', 'SMTP Error Message'];
    const rows = campaign.recipients.map(r => {
      const name = r.visitor_name || 'N/A';
      const sent = new Date(r.sent_at).toLocaleString();
      const opened = r.opened_at ? new Date(r.opened_at).toLocaleString() : '-';
      const error = r.error_message || '-';
      return `"${name}","${r.email}","${r.status}","${sent}","${opened}","${error}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + '\n' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campaign_report_${campaign.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Exported campaign log successfully!', 'success');
  }

  getRecipientsCount(campaign: Campaign): number {
    if (!campaign.recipient_ids) return 0;
    try {
      const ids = JSON.parse(campaign.recipient_ids);
      return Array.isArray(ids) ? ids.length : 0;
    } catch(e) {
      return 0;
    }
  }
}
