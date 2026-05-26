import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { Visitor, VisitorsService } from '../../services/visitors.service';
import { Venue, VenueService } from '../../../venue/services/venue.service';
import { ProductsService } from '../../../products/services/products.service';
import { DepartmentService } from '../../../department/services/department.service';
import { LeadCategoryService } from '../../../lead-category/services/lead-category.service';
import { INTEREST_OPTIONS } from '../../../../core/constants/form-options';
import { environment } from '../../../../../environments/environment';
import { VisitingCardUploadComponent } from '../../../enquiry-form/components/visiting-card-upload.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination.component';
import { PermissionService } from '../../../../core/permissions/permission.service';
import { Router } from '@angular/router';
import { EmailCampaignsService } from '../../../email-campaigns/services/email-campaigns.service';

export type LeadCategory = string;

type ExtractedVisitingCardData = Partial<{
  title: string;
  fullName: string;
  companyName: string;
  email: string;
  mobile: string;
  jobTitle: string;
  website: string;
  address: string;
}>;

@Component({
  selector: 'app-visitors-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, VisitingCardUploadComponent, PaginationComponent],
  templateUrl: './visitors-page.html',
  styleUrl: './visitors-page.css',
})
export class VisitorsPage implements OnInit {
  private visitorsService = inject(VisitorsService);
  private venueService = inject(VenueService);
  private productsService = inject(ProductsService);
  private departmentService = inject(DepartmentService);
  private leadCategoryService = inject(LeadCategoryService);
  private fb = inject(FormBuilder);
  private permissionService = inject(PermissionService);
  private emailCampaignsService = inject(EmailCampaignsService);
  private router = inject(Router);

  // Email Campaign integration
  selectedVisitorIds = signal<Set<number>>(new Set());
  visitorHistory = signal<any[]>([]);
  visitorHistoryLoading = signal<boolean>(false);
  lastContactedDate = signal<string | null>(null);

  get canAdd() { return this.permissionService.canAdd('visitors_directory'); }
  get canEdit() { return this.permissionService.canEdit('visitors_directory'); }
  get canDelete() { return this.permissionService.canDelete('visitors_directory'); }
  get canExport() { return this.permissionService.canExport('visitors_directory'); }
  get canViewDetails() { return this.permissionService.canViewDetails('visitors_directory'); }

  visitors = signal<Visitor[]>([]);
  venues = signal<Venue[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  viewMode = signal<'grid' | 'table'>('table');
  selectedVisitor = signal<Visitor | null>(null);
  selectedCardVisitor = signal<Visitor | null>(null);
  
  
  // Toast Notification
  toastMessage = signal<{text: string, type: 'success' | 'error'} | null>(null);
  private toastTimeout: any;

  // Edit mode
  editingVisitor = signal<Visitor | null>(null);
  editFormData = signal<Partial<Visitor>>({});
  
  // Delete mode
  visitorToDelete = signal<Visitor | null>(null);

  // Add mode
  isAddModalOpen = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  addVisitorForm!: FormGroup;
  selectedInterests = signal<string[]>([]);
  selectedFile = signal<File | null>(null);
  selectedFile2 = signal<File | null>(null);
  filePreview = signal<string | null>(null);
  filePreview2 = signal<string | null>(null);
  isScanningCard = signal<boolean>(false);
  cardScanMessage = signal<string | null>(null);
  private cardScanToken = 0;
  isUpdatingVisitorCard = signal<boolean>(false);
  isUpdatingVisitorCard2 = signal<boolean>(false);
  isUpdatingVoiceNote = signal<boolean>(false);
  isUpdatingVoiceNote2 = signal<boolean>(false);

  cameraModalSlot = signal<1 | 2 | null>(null);
  cameraStream = signal<MediaStream | null>(null);
  capturedCardPreview = signal<string | null>(null);
  
  // Voice Note Recording
  isRecording = signal<boolean>(false);
  recordingTime = signal<number>(0);
  recordingBlob = signal<Blob | null>(null);
  recordingUrl = signal<string | null>(null);
  private sanitizer = inject(DomSanitizer);
  safeRecordingUrl = computed(() => {
    const url = this.recordingUrl();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  });

  // Voice Note 2 Recording
  isRecording2 = signal<boolean>(false);
  recordingTime2 = signal<number>(0);
  recordingBlob2 = signal<Blob | null>(null);
  recordingUrl2 = signal<string | null>(null);
  safeRecordingUrl2 = computed(() => {
    const url = this.recordingUrl2();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  });

  // Edit modal voice note recording
  showEditVoiceRecorder = signal<boolean>(false);
  isEditRecording = signal<boolean>(false);
  editRecordingTime = signal<number>(0);
  editRecordingBlob = signal<Blob | null>(null);
  editRecordingUrl = signal<string | null>(null);
  safeEditRecordingUrl = computed(() => {
    const url = this.editRecordingUrl();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  });

  showEditVoiceRecorder2 = signal<boolean>(false);
  isEditRecording2 = signal<boolean>(false);
  editRecordingTime2 = signal<number>(0);
  editRecordingBlob2 = signal<Blob | null>(null);
  editRecordingUrl2 = signal<string | null>(null);
  safeEditRecordingUrl2 = computed(() => {
    const url = this.editRecordingUrl2();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  });
  
  expandedAudioId = signal<number | null>(null);
  expandedAudioSlot = signal<1 | 2 | null>(null);
  
  // Voice Note Custom Player State
  activeAudio = signal<HTMLAudioElement | null>(null);
  audioState = signal<{
    id: number | null,
    slot: 1 | 2 | null,
    isPlaying: boolean,
    progress: number,
    currentTime: number,
    duration: number,
    isLoading: boolean,
    hasError: boolean
  }>({
    id: null,
    slot: null,
    isPlaying: false,
    progress: 0,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    hasError: false
  });
  
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingInterval: any;
  private editMediaRecorder: MediaRecorder | null = null;
  private editAudioChunks: Blob[] = [];
  private editRecordingInterval: ReturnType<typeof setInterval> | null = null;
  private editMediaRecorder2: MediaRecorder | null = null;
  private editAudioChunks2: Blob[] = [];
  private editRecordingInterval2: ReturnType<typeof setInterval> | null = null;
  
  searchQuery = signal<string>('');
  activeCategory = signal<string>('All');
  activeDepartment = signal<string>('');
  
  leadCategories = signal<string[]>([]);
  departments = signal<string[]>([]);

  titles = ['Mr', 'Ms', 'Mrs', 'Dr'];
  jobTitles = ['CEO', 'CTO', 'Manager', 'Engineer', 'Developer', 'Sales Executive', 'Consultant', 'Other'];
  productInterests = INTEREST_OPTIONS.map(option => option.value);

  filterTabs = computed(() => ['All', ...this.leadCategories()]);

  // Pagination
  pageSize = signal<number>(5);
  currentPage = signal<number>(1);
  sortKey = signal<string>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  filteredVisitors = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.activeCategory();
    const dept = this.activeDepartment();
    
    let result = this.visitors();
    
    if (category !== 'All') {
      result = result.filter(v => v.lead_category === category);
    }
    
    if (dept) {
      result = result.filter(v => v.department === dept);
    }
    
    if (query) {
      result = result.filter(v => 
        (v.full_name?.toLowerCase().includes(query)) ||
        (v.company_name?.toLowerCase().includes(query)) ||
        (v.job_title?.toLowerCase().includes(query)) ||
        (v.email?.toLowerCase().includes(query)) ||
        (v.mobile?.toLowerCase().includes(query)) ||
        (v.alternate_mobile?.toLowerCase().includes(query)) ||
        (v.office_number?.toLowerCase().includes(query)) ||
        (v.details?.toLowerCase().includes(query)) ||
        (v.department?.toLowerCase().includes(query)) ||
        (v.interests?.some(i => i.toLowerCase().includes(query)))
      );
    }
    
    return result;
  });

  // Analytics Metrics
  totalVisitors = computed(() => this.visitors().length);
readonly leadCategoryStats = computed(() => {
  const stats: Record<string, number> = {};

  this.leadCategories().forEach(category => {
    stats[category] = this.visitors().filter(
      v => v.lead_category === category
    ).length;
  });

  return stats;
});

  sortedVisitors = computed(() => this.sortRows(this.filteredVisitors(), this.getVisitorSortValue.bind(this)));

  totalPages = computed(() => {
    const total = this.sortedVisitors().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  paginatedVisitors = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.sortedVisitors().slice(start, end);
  });

  showToast(text: string, type: 'success' | 'error' = 'success') {
    this.toastMessage.set({ text, type });
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
  }

  onCategoryChange(category: string) {
    this.activeCategory.set(category);
    this.currentPage.set(1);
  }

  onDepartmentChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.activeDepartment.set(target.value);
    this.currentPage.set(1);
  }

  sortBy(key: string) {
    if (this.sortKey() === key) {
      this.sortDirection.update(direction => direction === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  sortIndicator(key: string): string {
    if (this.sortKey() !== key) {
      return '↕';
    }
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  updateLeadCategory(visitor: Visitor, event: Event) {
    event.stopPropagation();
    const select = event.target as HTMLSelectElement;
    const newCategory = select.value as LeadCategory;
    
    // Optimistic Update
    this.visitors.update(vs => vs.map(v => 
      v.id === visitor.id ? { ...v, lead_category: newCategory } : v
    ));

    // Persist to DB
    this.visitorsService.updateCategory(visitor.id, newCategory).subscribe({
      next: () => {
        this.showToast('Lead category updated successfully', 'success');
      },
      error: (err) => {
        console.error('Failed to update category', err);
        // Revert on failure
        this.visitors.update(vs => vs.map(v => 
          v.id === visitor.id ? { ...v, lead_category: visitor.lead_category } : v
        ));
        this.showToast('Failed to save category', 'error');
      }
    });
  }

  openEdit(visitor: Visitor, event: Event) {
    event.stopPropagation();
    this.clearEditVoiceRecording();
    this.clearEditVoiceRecording2();
    this.editingVisitor.set(visitor);
    this.editFormData.set({ ...visitor });
    this.isUpdatingVisitorCard.set(false);
    this.isUpdatingVisitorCard2.set(false);
    this.isUpdatingVoiceNote.set(false);
    this.isUpdatingVoiceNote2.set(false);
  }

  closeEdit() {
    this.clearEditVoiceRecording();
    this.clearEditVoiceRecording2();
    this.editingVisitor.set(null);
    this.editFormData.set({});
    this.isUpdatingVisitorCard.set(false);
    this.isUpdatingVisitorCard2.set(false);
    this.isUpdatingVoiceNote.set(false);
    this.isUpdatingVoiceNote2.set(false);
  }

  saveEdit() {
    const currentEdit = this.editingVisitor();
    const formData = this.editFormData();
    const interests = Array.isArray(formData.interests) ? formData.interests : [];
    if (currentEdit) {
      if (interests.length === 0) {
        this.showToast('Please select at least one product interest.', 'error');
        return;
      }

      // Optimistic update
      this.visitors.update(vs => vs.map(v => 
        v.id === currentEdit.id ? { ...v, ...formData, interests } as Visitor : v
      ));

      // Persist to DB
      this.visitorsService.updateVisitor(currentEdit.id, { ...formData, interests }).subscribe({
        next: () => {
          this.showToast('Visitor details saved successfully', 'success');
        },
        error: (err) => {
          console.error('Failed to update visitor', err);
          this.showToast('Failed to save visitor details', 'error');
        }
      });
      this.closeEdit();
    }
  }

  toggleEditInterest(interest: string) {
    const formData = this.editFormData();
    const current = Array.isArray(formData.interests) ? formData.interests : [];
    const interests = current.includes(interest)
      ? current.filter(item => item !== interest)
      : [...current, interest];

    this.editFormData.set({ ...formData, interests });
  }

  openDeleteConfirmation(visitor: Visitor, event: Event) {
    event.stopPropagation();
    this.visitorToDelete.set(visitor);
  }

  closeDeleteConfirmation() {
    this.visitorToDelete.set(null);
  }

  confirmDelete() {
    const visitor = this.visitorToDelete();
    if (visitor) {
      this.visitors.update(vs => vs.filter(v => v.id !== visitor.id));
      this.visitorsService.deleteVisitor(visitor.id).subscribe({
        next: () => {
          this.showToast('Visitor deleted successfully', 'success');
        },
        error: (err) => {
          console.error('Failed to delete visitor', err);
          this.showToast('Failed to delete visitor', 'error');
        }
      });
      this.closeDeleteConfirmation();
    }
  }

  initForm() {
    this.addVisitorForm = this.fb.group({
      title: ['Mr', Validators.required],
      fullName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s.]+$/)]],
      companyName: ['', [Validators.pattern(/^[a-zA-Z0-9\s&.-]+$/)]],
      jobTitle: [''],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      alternateMobile: ['', [Validators.pattern(/^\d{10}$/)]],
      officeNumber: ['', [Validators.pattern(/^\d{0,15}$/)]],
      department: [''],
      leadCategory: [''],
      venueId: ['', Validators.required],
        referred_by: [''],
      remarks: ['', Validators.maxLength(500)],
      details: ['']
    });
  } 

  openAddModal() {
    this.initForm();
    this.selectedInterests.set([]);
    this.selectedFile.set(null);
    this.filePreview.set(null);
    this.isScanningCard.set(false);
    this.cardScanMessage.set(null);
    this.cardScanToken++;
    this.clearVoiceNote();
    this.clearVoiceNote2();
    this.selectedFile2.set(null);
    this.filePreview2.set(null);
    this.isAddModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeAddModal() {
    this.isAddModalOpen.set(false);
    document.body.style.overflow = 'auto';
  }

  toggleInterest(interest: string) {
    const current = this.selectedInterests();
    if (current.includes(interest)) {
      this.selectedInterests.set(current.filter(i => i !== interest));
    } else {
      this.selectedInterests.set([...current, interest]);
    }
  }

  onMobileKeypress(event: KeyboardEvent) {
    if (!/[0-9]/.test(event.key) && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onMobileInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value.replace(/[^0-9]/g, '');
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    inputElement.value = value;
    this.addVisitorForm.get('mobile')?.setValue(value, { emitEvent: false });
  }

  onAlternateMobileKeypress(event: KeyboardEvent) {
    if (!/[0-9]/.test(event.key) && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onAlternateMobileInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value.replace(/[^0-9]/g, '');
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    inputElement.value = value;
    this.addVisitorForm.get('alternateMobile')?.setValue(value, { emitEvent: false });
  }

  onPasteSanitizeAlternateMobile(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const sanitized = pastedData.replace(/\D/g, '').slice(0, 10);
    this.addVisitorForm.get('alternateMobile')?.setValue(sanitized);
  }

  onOfficeNumberKeypress(event: KeyboardEvent) {
    if (!/[0-9]/.test(event.key) && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onOfficeNumberInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value.replace(/[^0-9]/g, '');
    if (value.length > 15) {
      value = value.substring(0, 15);
    }
    inputElement.value = value;
    this.addVisitorForm.get('officeNumber')?.setValue(value, { emitEvent: false });
  }

  onPasteSanitizeOfficeNumber(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const sanitized = pastedData.replace(/\D/g, '').slice(0, 15);
    this.addVisitorForm.get('officeNumber')?.setValue(sanitized);
  }

  sanitizeEditPhoneField(field: 'mobile' | 'alternate_mobile' | 'office_number', event: Event, maxLength: number) {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, maxLength);
    if (input.value !== digitsOnly) {
      input.value = digitsOnly;
    }
    this.editFormData.set({ ...this.editFormData(), [field]: digitsOnly });
  }

  onEditPhoneKeypress(event: KeyboardEvent, maxLength: number) {
    if (!/[0-9]/.test(event.key) && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key)) {
      event.preventDefault();
    }
    const input = event.target as HTMLInputElement;
    if (/[0-9]/.test(event.key) && input.value.replace(/\D/g, '').length >= maxLength) {
      event.preventDefault();
    }
  }

  onFullNameKeypress(event: KeyboardEvent) {
    if (!/[a-zA-Z\s.]/.test(event.key) && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onFullNameInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value.replace(/[^a-zA-Z\s.]/g, '');
    value = value.replace(/\s{2,}/g, ' '); // Trim double spaces
    inputElement.value = value;
    this.addVisitorForm.get('fullName')?.setValue(value, { emitEvent: false });
  }

  onPasteSanitizeMobile(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const sanitized = pastedData.replace(/[^0-9]/g, '').substring(0, 10);
    this.addVisitorForm.get('mobile')?.setValue(sanitized);
  }

  onPasteSanitizeFullName(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    let sanitized = pastedData.replace(/[^a-zA-Z\s.]/g, '');
    sanitized = sanitized.replace(/\s{2,}/g, ' ');
    this.addVisitorForm.get('fullName')?.setValue(sanitized);
  }

  onVisitingCard1File(file: File) {
    this.applyVisitorCardFile(file, 1);
  }

  onVisitingCard2File(file: File) {
    this.applyVisitorCardFile(file, 2);
  }

  private applyVisitorCardFile(file: File, slot: 1 | 2) {
    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      this.showToast('Only PNG and JPG images are allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('File size should not exceed 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (slot === 1) {
        this.selectedFile.set(file);
        this.filePreview.set(result);
        this.scanVisitingCard(file);
        return;
      }
      this.selectedFile2.set(file);
      this.filePreview2.set(result);
    };
    reader.readAsDataURL(file);
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0] as File;
    if (file) {
      this.applyVisitorCardFile(file, 1);
    }
  }

  removeFile() {
    this.selectedFile.set(null);
    this.filePreview.set(null);
    this.isScanningCard.set(false);
    this.cardScanMessage.set(null);
    this.cardScanToken++;
    this.addVisitorForm.get('details')?.setValue('');
  }

  onFileSelected2(event: any) {
    const file = event.target.files?.[0] as File;
    if (file) {
      this.applyVisitorCardFile(file, 2);
    }
  }

  removeFile2() {
    this.selectedFile2.set(null);
    this.filePreview2.set(null);
  }

  private async scanVisitingCard(file: File) {
    const scanToken = ++this.cardScanToken;
    this.isScanningCard.set(true);
    this.cardScanMessage.set('Scanning visiting card...');
    let worker: any;

    try {
      const { createWorker, PSM } = await import('tesseract.js');
      worker = await createWorker('eng', 1, {
        logger: (message: any) => {
          if (scanToken !== this.cardScanToken || !message?.status) return;
          if (message.status === 'recognizing text' && typeof message.progress === 'number') {
            this.cardScanMessage.set(`Scanning visiting card... ${Math.round(message.progress * 100)}%`);
          }
        }
      });
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        preserve_interword_spaces: '1'
      });
      const result = await worker.recognize(file);

      if (scanToken !== this.cardScanToken) return;

      const rawText = result.data.text || '';
      const extracted = this.extractVisitingCardData(rawText);
      const filledCount = this.applyExtractedCardData(extracted, rawText);

      if (filledCount > 0) {
        this.cardScanMessage.set(`Auto-filled ${filledCount} field${filledCount === 1 ? '' : 's'} from the card.`);
      } else {
        this.cardScanMessage.set('No clear details found. Please enter the remaining fields manually.');
      }
    } catch (error) {
      console.error('Visiting card scan failed', error);
      if (scanToken === this.cardScanToken) {
        this.cardScanMessage.set('Card scan failed. You can continue entering details manually.');
      }
    } finally {
      if (worker) {
        await worker.terminate();
      }
      if (scanToken === this.cardScanToken) {
        this.isScanningCard.set(false);
      }
    }
  }

  private extractVisitingCardData(rawText: string): ExtractedVisitingCardData {
    const lines = rawText
      .split(/\r?\n/)
      .map(line => line.replace(/[|•·]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(line => line.length > 1);

    const text = lines.join('\n');
    const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    const website = text.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?=\/|\b)/i)?.[0];
    const phone = this.extractPhoneNumber(text);
    const title = this.extractTitle(lines);
    const fullName = this.extractName(lines, email);
    const jobTitle = this.extractDesignation(lines);
    const companyName = this.extractCompany(lines, fullName, jobTitle, email, website);
    const address = this.extractAddress(lines, email, website);

    return {
      title,
      fullName,
      companyName,
      email,
      mobile: phone,
      jobTitle,
      website,
      address
    };
  }

  private extractPhoneNumber(text: string): string | undefined {
    const matches = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || [];
    for (const match of matches) {
      const digits = match.replace(/\D/g, '');
      if (digits.length >= 10) {
        return digits.slice(-10);
      }
    }
    return undefined;
  }

  private extractTitle(lines: string[]): string | undefined {
    const joined = lines.join(' ');
    const match = joined.match(/\b(Mr|Ms|Mrs|Dr)\.?\b/i)?.[1];
    if (!match) return undefined;
    return this.titles.find(t => t.toLowerCase() === match.toLowerCase());
  }

  private extractName(lines: string[], email?: string): string | undefined {
    const blockedWords = /(www|http|@|email|mail|phone|mobile|tel|fax|address|road|street|india|pvt|ltd|limited|inc|llc|solutions|technologies|systems|company|corp|manager|engineer|director|executive|consultant|officer|sales|marketing)/i;
    const candidates = lines
      .map(line => line.replace(/\b(Mr|Ms|Mrs|Dr)\.?\s+/i, '').trim())
      .filter(line => /^[a-zA-Z .]{3,}$/.test(line))
      .filter(line => !blockedWords.test(line))
      .filter(line => !email || !line.toLowerCase().includes(email.toLowerCase()));

    return candidates
      .sort((a, b) => this.nameScore(b) - this.nameScore(a))[0]
      ?.replace(/\s{2,}/g, ' ')
      .trim();
  }

  private nameScore(value: string): number {
    const parts = value.split(/\s+/).filter(Boolean);
    let score = parts.length >= 2 && parts.length <= 4 ? 4 : 0;
    if (parts.every(part => /^[A-Z][a-z.]+$/.test(part) || /^[A-Z]{2,}$/.test(part))) score += 2;
    if (value.length > 28) score -= 3;
    return score;
  }

  private extractDesignation(lines: string[]): string | undefined {
    const designationWords = /(founder|co-founder|ceo|cto|cfo|director|president|manager|engineer|developer|consultant|executive|officer|head|lead|sales|marketing|operations|architect|analyst|specialist|administrator)/i;
    const designation = lines.find(line => designationWords.test(line) && !/@|www|http/i.test(line));
    return designation?.replace(/\s{2,}/g, ' ').trim();
  }

  private extractCompany(lines: string[], fullName?: string, jobTitle?: string, email?: string, website?: string): string | undefined {
    const companyWords = /(pvt|private|ltd|limited|llp|inc|llc|corp|corporation|company|solutions|technologies|technology|systems|industries|enterprises|automation|services|group)/i;
    const obvious = lines.find(line => companyWords.test(line) && !/@|www|http/i.test(line));
    if (obvious) return this.cleanCompanyName(obvious);

    const candidate = lines.find(line => {
      const normalized = line.toLowerCase();
      return line.length >= 3 &&
        !/@|www|http|\d{5,}/i.test(line) &&
        normalized !== fullName?.toLowerCase() &&
        normalized !== jobTitle?.toLowerCase() &&
        normalized !== email?.toLowerCase() &&
        normalized !== website?.toLowerCase();
    });

    return candidate ? this.cleanCompanyName(candidate) : undefined;
  }

  private cleanCompanyName(value: string): string {
    return value
      .replace(/\b(company|organization)\s*[:\-]\s*/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private extractAddress(lines: string[], email?: string, website?: string): string | undefined {
    const addressWords = /(address|road|rd\.?|street|st\.?|avenue|ave\.?|nagar|phase|sector|floor|block|plot|city|state|pin|zip|india|\b\d{5,6}\b)/i;
    const addressLines = lines.filter(line =>
      addressWords.test(line) &&
      !/@|www|http/i.test(line) &&
      line.toLowerCase() !== email?.toLowerCase() &&
      line.toLowerCase() !== website?.toLowerCase()
    );

    return addressLines.length ? addressLines.join(', ') : undefined;
  }

  private applyExtractedCardData(data: ExtractedVisitingCardData, rawText: string): number {
    let filledCount = 0;
    const fillIfEmpty = (controlName: string, value?: string) => {
      const control = this.addVisitorForm.get(controlName);
      const normalized = value?.trim();
      if (!control || !normalized || String(control.value || '').trim()) return;
      control.setValue(normalized);
      control.markAsPristine();
      filledCount++;
    };

    if (data.title && this.addVisitorForm.get('title')?.pristine) {
      this.addVisitorForm.get('title')?.setValue(data.title);
    }

    fillIfEmpty('fullName', data.fullName?.replace(/[^a-zA-Z\s.]/g, '').replace(/\s{2,}/g, ' '));
    fillIfEmpty('companyName', data.companyName?.replace(/[^a-zA-Z0-9\s&.-]/g, '').replace(/\s{2,}/g, ' '));
    fillIfEmpty('email', data.email);
    fillIfEmpty('mobile', data.mobile);

    if (data.jobTitle?.trim()) {
      const designation = data.jobTitle.trim();
      if (!this.jobTitles.includes(designation)) {
        this.jobTitles = [...this.jobTitles, designation];
      }
      fillIfEmpty('jobTitle', designation);
    }

    const normalizedDetails = rawText.trim();
    if (normalizedDetails) {
      this.addVisitorForm.get('details')?.setValue(normalizedDetails);
      filledCount++;
    }

    return filledCount;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onFileSelected({ target: { files: [files[0]] } });
    }
  }

  async toggleRecording() {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.recordingBlob.set(audioBlob);
        this.recordingUrl.set(URL.createObjectURL(audioBlob));
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      this.mediaRecorder.start();
      this.isRecording.set(true);
      this.recordingTime.set(0);
      
      this.recordingInterval = setInterval(() => {
        this.recordingTime.update(t => t + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      this.showToast('Could not access microphone. Please check permissions.', 'error');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording()) {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
      clearInterval(this.recordingInterval);
    }
  }

  clearVoiceNote() {
    if (this.isRecording()) {
      this.stopRecording();
    }
    const currentUrl = this.recordingUrl();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
    this.recordingBlob.set(null);
    this.recordingUrl.set(null);
    this.recordingTime.set(0);
  }

  async toggleRecording2() {
    if (this.isRecording2()) {
      this.stopRecording2();
    } else {
      await this.startRecording2();
    }
  }

  async startRecording2() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.recordingBlob2.set(audioBlob);
        this.recordingUrl2.set(URL.createObjectURL(audioBlob));
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      this.mediaRecorder.start();
      this.isRecording2.set(true);
      this.recordingTime2.set(0);
      
      this.recordingInterval = setInterval(() => {
        this.recordingTime2.update(t => t + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      this.showToast('Could not access microphone. Please check permissions.', 'error');
    }
  }

  stopRecording2() {
    if (this.mediaRecorder && this.isRecording2()) {
      this.mediaRecorder.stop();
      this.isRecording2.set(false);
      clearInterval(this.recordingInterval);
    }
  }

  clearVoiceNote2() {
    if (this.isRecording2()) {
      this.stopRecording2();
    }
    const currentUrl = this.recordingUrl2();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
    this.recordingBlob2.set(null);
    this.recordingUrl2.set(null);
    this.recordingTime2.set(0);
  }

  async recordNewVoiceNote() {
    this.clearVoiceNote();
    await this.startRecording();
  }

  async recordNewVoiceNote2() {
    this.clearVoiceNote2();
    await this.startRecording2();
  }

  async startEditVoiceNoteRecording() {
    this.clearEditVoiceRecording2();
    this.clearEditVoiceRecording();
    this.showEditVoiceRecorder.set(true);
    if (!this.isEditRecording()) {
      await this.toggleEditRecording();
    }
  }

  async startEditVoiceNoteRecording2() {
    this.clearEditVoiceRecording();
    this.clearEditVoiceRecording2();
    this.showEditVoiceRecorder2.set(true);
    if (!this.isEditRecording2()) {
      await this.toggleEditRecording2();
    }
  }

  async toggleEditRecording() {
    if (this.isEditRecording()) {
      this.stopEditRecording();
    } else {
      await this.startEditRecording();
    }
  }

  async startEditRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.editMediaRecorder = new MediaRecorder(stream);
      this.editAudioChunks = [];

      this.editMediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.editAudioChunks.push(event.data);
        }
      };

      this.editMediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.editAudioChunks, { type: 'audio/webm' });
        this.editRecordingBlob.set(audioBlob);
        this.editRecordingUrl.set(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
        this.uploadEditVoiceNoteFromBlob(audioBlob);
      };

      this.editMediaRecorder.start();
      this.isEditRecording.set(true);
      this.editRecordingTime.set(0);

      this.editRecordingInterval = setInterval(() => {
        this.editRecordingTime.update(t => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      this.showToast('Could not access microphone. Please check permissions.', 'error');
    }
  }

  stopEditRecording() {
    if (this.editMediaRecorder && this.isEditRecording()) {
      this.editMediaRecorder.stop();
      this.isEditRecording.set(false);
      if (this.editRecordingInterval) {
        clearInterval(this.editRecordingInterval);
        this.editRecordingInterval = null;
      }
    }
  }

  cancelEditVoiceRecording() {
    this.clearEditVoiceRecording();
  }

  clearEditVoiceRecording() {
    if (this.isEditRecording()) {
      this.stopEditRecording();
    }
    const currentUrl = this.editRecordingUrl();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
    this.showEditVoiceRecorder.set(false);
    this.editRecordingBlob.set(null);
    this.editRecordingUrl.set(null);
    this.editRecordingTime.set(0);
  }

  async toggleEditRecording2() {
    if (this.isEditRecording2()) {
      this.stopEditRecording2();
    } else {
      await this.startEditRecording2();
    }
  }

  async startEditRecording2() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.editMediaRecorder2 = new MediaRecorder(stream);
      this.editAudioChunks2 = [];

      this.editMediaRecorder2.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.editAudioChunks2.push(event.data);
        }
      };

      this.editMediaRecorder2.onstop = () => {
        const audioBlob = new Blob(this.editAudioChunks2, { type: 'audio/webm' });
        this.editRecordingBlob2.set(audioBlob);
        this.editRecordingUrl2.set(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
        this.uploadEditVoiceNoteFromBlob2(audioBlob);
      };

      this.editMediaRecorder2.start();
      this.isEditRecording2.set(true);
      this.editRecordingTime2.set(0);

      this.editRecordingInterval2 = setInterval(() => {
        this.editRecordingTime2.update(t => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      this.showToast('Could not access microphone. Please check permissions.', 'error');
    }
  }

  stopEditRecording2() {
    if (this.editMediaRecorder2 && this.isEditRecording2()) {
      this.editMediaRecorder2.stop();
      this.isEditRecording2.set(false);
      if (this.editRecordingInterval2) {
        clearInterval(this.editRecordingInterval2);
        this.editRecordingInterval2 = null;
      }
    }
  }

  cancelEditVoiceRecording2() {
    this.clearEditVoiceRecording2();
  }

  clearEditVoiceRecording2() {
    if (this.isEditRecording2()) {
      this.stopEditRecording2();
    }
    const currentUrl = this.editRecordingUrl2();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
    this.showEditVoiceRecorder2.set(false);
    this.editRecordingBlob2.set(null);
    this.editRecordingUrl2.set(null);
    this.editRecordingTime2.set(0);
  }

  private uploadVoiceNoteFile(file: File, slot: 1 | 2) {
    const visitor = this.editingVisitor();
    if (!visitor) return;

    if (file.size > 10 * 1024 * 1024) {
      this.showToast('Voice note size should not exceed 10MB.', 'error');
      return;
    }

    if (slot === 1) {
      this.isUpdatingVoiceNote.set(true);
      this.visitorsService.updateVisitorVoiceNote(visitor.id, file).subscribe({
        next: (response) => this.handleVoiceNoteUploadSuccess(visitor, response.voiceNoteUrl, 1),
        error: (err) => this.handleVoiceNoteUploadError(err, 1)
      });
      return;
    }

    this.isUpdatingVoiceNote2.set(true);
    this.visitorsService.updateVisitorVoiceNote2(visitor.id, file).subscribe({
      next: (response) => this.handleVoiceNoteUploadSuccess(visitor, response.voiceNoteUrl2, 2),
      error: (err) => this.handleVoiceNoteUploadError(err, 2)
    });
  }

  private handleVoiceNoteUploadSuccess(visitor: Visitor, url: string | null, slot: 1 | 2) {
    const patch = slot === 1 ? { voice_note_url: url } : { voice_note_url_2: url };
    const updatedVisitor = { ...visitor, ...this.editFormData(), ...patch } as Visitor;
    this.editingVisitor.set(updatedVisitor);
    this.editFormData.set({ ...this.editFormData(), ...patch });
    this.visitors.update(vs => vs.map(v => v.id === visitor.id ? updatedVisitor : v));
    this.showToast(`Voice note${slot === 2 ? ' 2' : ''} updated successfully`, 'success');
    if (slot === 1) {
      this.isUpdatingVoiceNote.set(false);
      this.clearEditVoiceRecording();
    } else {
      this.isUpdatingVoiceNote2.set(false);
      this.clearEditVoiceRecording2();
    }
  }

  private handleVoiceNoteUploadError(err: unknown, slot: 1 | 2) {
    console.error(`Failed to update voice note${slot === 2 ? ' 2' : ''}`, err);
    this.showToast(`Failed to update voice note${slot === 2 ? ' 2' : ''}`, 'error');
    if (slot === 1) {
      this.isUpdatingVoiceNote.set(false);
    } else {
      this.isUpdatingVoiceNote2.set(false);
    }
  }

  private uploadEditVoiceNoteFromBlob(blob: Blob) {
    const file = new File([blob], `voicenote-${Date.now()}.webm`, { type: 'audio/webm' });
    this.uploadVoiceNoteFile(file, 1);
  }

  private uploadEditVoiceNoteFromBlob2(blob: Blob) {
    const file = new File([blob], `voicenote-2-${Date.now()}.webm`, { type: 'audio/webm' });
    this.uploadVoiceNoteFile(file, 2);
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  playAudio(visitor: Visitor, slot: 1 | 2, event: Event) {
    event.stopPropagation();

    // If same visitor and same slot, toggle play/pause
    if (this.audioState().id === visitor.id && this.audioState().slot === slot) {
      if (this.audioState().isPlaying) {
        this.pauseAudio();
      } else {
        this.resumeAudio();
      }
      return;
    }

    // Stop current audio if any
    this.stopAudio();

    // Expand new one
    this.expandedAudioId.set(visitor.id);
    this.expandedAudioSlot.set(slot);

    const sourceUrl = slot === 1 ? visitor.voice_note_url : visitor.voice_note_url_2;
    if (!sourceUrl) {
      this.audioState.set({ ...this.audioState(), id: visitor.id, slot, hasError: true });
      return;
    }

    const url = this.getImageUrl(sourceUrl);
    const audio = new Audio(url);
    
    this.audioState.update(s => ({ ...s, id: visitor.id, isLoading: true, hasError: false, isPlaying: false, progress: 0, currentTime: 0, duration: 0 }));
    
    audio.onloadedmetadata = () => {
      this.audioState.update(s => ({ ...s, duration: audio.duration }));
    };
    
    audio.oncanplaythrough = () => {
      this.audioState.update(s => ({ ...s, isLoading: false }));
      audio.play().catch(e => {
        console.error("Audio playback error:", e);
        this.audioState.update(s => ({ ...s, hasError: true, isLoading: false }));
      });
    };
    
    audio.onplay = () => {
      this.audioState.update(s => ({ ...s, isPlaying: true }));
    };
    
    audio.onpause = () => {
      this.audioState.update(s => ({ ...s, isPlaying: false }));
    };
    
    audio.ontimeupdate = () => {
      this.audioState.update(s => ({ 
        ...s, 
        currentTime: audio.currentTime,
        progress: (audio.currentTime / audio.duration) * 100
      }));
    };
    
    audio.onended = () => {
      this.audioState.update(s => ({ ...s, isPlaying: false, progress: 0, currentTime: 0 }));
    };
    
    audio.onerror = () => {
      this.audioState.update(s => ({ ...s, hasError: true, isLoading: false }));
    };

    this.activeAudio.set(audio);
    
    // Attempt to load and play
    audio.load();
  }

  pauseAudio() {
    const audio = this.activeAudio();
    if (audio) {
      audio.pause();
    }
  }

  resumeAudio() {
    const audio = this.activeAudio();
    if (audio) {
      audio.play().catch(e => {
        console.error("Audio playback error:", e);
        this.audioState.update(s => ({ ...s, hasError: true }));
      });
    }
  }

  stopAudio(event?: Event) {
    if (event) event.stopPropagation();
    const audio = this.activeAudio();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
    }
    this.activeAudio.set(null);
    this.audioState.set({
      id: null,
      slot: null,
      isPlaying: false,
      progress: 0,
      currentTime: 0,
      duration: 0,
      isLoading: false,
      hasError: false
    });
    this.expandedAudioId.set(null);
    this.expandedAudioSlot.set(null);
  }

  seekAudio(event: MouseEvent) {
    event.stopPropagation();
    const audio = this.activeAudio();
    if (!audio) return;
    
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    
    audio.currentTime = percentage * audio.duration;
  }

  toggleAudioPlayback(id: number, slot: 1 | 2 = 1, event: Event) {
    event.stopPropagation();
    if (this.expandedAudioId() === id && this.expandedAudioSlot() === slot) {
      this.stopAudio();
    } else {
      const visitor = this.visitors().find(v => v.id === id);
      if (visitor) {
        this.playAudio(visitor, slot, event);
      }
    }
  }

  saveNewVisitor() {
    if (this.addVisitorForm.invalid) {
      this.addVisitorForm.markAllAsTouched();
      this.showToast('Please correct the errors in the form.', 'error');
      return;
    }

    if (this.selectedInterests().length === 0) {
      this.showToast('Please select at least one product interest.', 'error');
      return;
    }

    this.isSubmitting.set(true);
    const formValues = this.addVisitorForm.value;
    const formData = new FormData();
    
    formData.append('title', formValues.title);
    formData.append('fullName', formValues.fullName);
    formData.append('email', formValues.email);
    formData.append('mobile', formValues.mobile);
    if (formValues.alternateMobile) formData.append('alternateMobile', formValues.alternateMobile);
    if (formValues.officeNumber) formData.append('officeNumber', formValues.officeNumber);
    if (formValues.details) formData.append('details', formValues.details);
    if (formValues.companyName) formData.append('companyName', formValues.companyName);
    if (formValues.jobTitle) formData.append('jobTitle', formValues.jobTitle);
    if (formValues.department) formData.append('department', formValues.department);
    if (formValues.leadCategory) formData.append('leadCategory', formValues.leadCategory);
    if (formValues.venueId) formData.append('venueId', formValues.venueId);
    if (formValues.remarks) formData.append('remarks', formValues.remarks);
    if (formValues.referred_by) {
  formData.append('referred_by', formValues.referred_by);
}
    
    formData.append('interests', JSON.stringify(this.selectedInterests()));
    
    const file = this.selectedFile();
    if (file) {
      formData.append('visitingCard', file);
    }

    const file2 = this.selectedFile2();
    if (file2) {
      formData.append('visitingCard2', file2);
    }
    
    const voiceBlob = this.recordingBlob();
    if (voiceBlob) {
      const voiceFile = new File([voiceBlob], `voicenote-${Date.now()}.webm`, { type: 'audio/webm' });
      formData.append('voiceNote', voiceFile);
    }

    const voiceBlob2 = this.recordingBlob2();
    if (voiceBlob2) {
      const voiceFile2 = new File([voiceBlob2], `voicenote-2-${Date.now()}.webm`, { type: 'audio/webm' });
      formData.append('voiceNote2', voiceFile2);
    }

    this.visitorsService.createVisitorMultipart(formData).subscribe({
      next: (response: any) => {
        const newVisitor: Visitor = {
          id: response.payload.id,
          title: response.payload.title,
          full_name: response.payload.fullName,
          company_name: response.payload.companyName,
          job_title: response.payload.jobTitle,
          email: response.payload.email,
          mobile: response.payload.mobile,
          alternate_mobile: response.payload.alternateMobile,
          office_number: response.payload.officeNumber,
          department: response.payload.department,
          interests: response.payload.interests,
          visiting_card_url: response.payload.visitingCardUrl,
          visiting_card_url_2: response.payload.visitingCardUrl2,
          details: response.payload.details,
          voice_note_url: response.payload.voiceNoteUrl,
          voice_note_url_2: response.payload.voiceNoteUrl2,
          referred_by: response.payload.referred_by,
          remarks: response.payload.remarks,
          created_at: response.payload.createdAt,
          lead_category: response.payload.leadCategory
        };
        this.visitors.update(vs => [newVisitor, ...vs]);
        this.showToast('Visitor added successfully', 'success');
        this.isSubmitting.set(false);
        this.closeAddModal();
      },
      error: (err) => {
        console.error('Failed to add visitor', err);
        this.showToast('Failed to add visitor', 'error');
        this.isSubmitting.set(false);
      }
    });
  }

  downloadFilteredData() {
    const data = this.filteredVisitors();
    if (data.length === 0) {
      this.showToast('No data available to download', 'error');
      return;
    }

    const headers = ['Visitor Name', 'Company Name', 'Email', 'Mobile', 'Alternate Mobile', 'Office Number', 'Department', 'Lead Category', 'Created Date'];
    
    const rows = data.map(v => {
      const name = (v.title ? v.title + ' ' : '') + v.full_name;
      const date = new Date(v.created_at).toLocaleDateString();
      return `"${name}","${v.company_name || ''}","${v.email}","${v.mobile}","${v.alternate_mobile || ''}","${v.office_number || ''}","${v.department || ''}","${v.lead_category || ''}","${date}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + '\n' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    
    const categorySuffix = this.activeCategory() === 'All' ? 'all' : this.activeCategory().replace(/\s+/g, '_').toLowerCase();
    
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `visitors_export_${categorySuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showToast(`Exported ${data.length} records to CSV successfully`, 'success');
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(Number(target.value));
    this.currentPage.set(1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

    openReview(visitor: Visitor) {
      this.selectedVisitor.set(visitor);
      this.isUpdatingVisitorCard.set(false);
      this.isUpdatingVoiceNote.set(false);
      
      // Fetch recipient history
      if (visitor.id) {
        this.visitorHistoryLoading.set(true);
        this.emailCampaignsService.getVisitorHistory(visitor.id).subscribe({
          next: (res: any) => {
            this.visitorHistory.set(res.history || []);
            this.lastContactedDate.set(res.lastContacted || null);
            this.visitorHistoryLoading.set(false);
          },
          error: (err: any) => {
            console.error('Error fetching communication history:', err);
            this.visitorHistory.set([]);
            this.lastContactedDate.set(null);
            this.visitorHistoryLoading.set(false);
          }
        });
      }
    }

    toggleSelectVisitor(visitorId: number, event: Event) {
      event.stopPropagation();
      this.selectedVisitorIds.update(set => {
        const newSet = new Set(set);
        if (newSet.has(visitorId)) {
          newSet.delete(visitorId);
        } else {
          newSet.add(visitorId);
        }
        return newSet;
      });
    }

    isVisitorSelected(visitorId: number): boolean {
      return this.selectedVisitorIds().has(visitorId);
    }

    toggleSelectAll(event: Event) {
      const checkbox = event.target as HTMLInputElement;
      if (checkbox.checked) {
        const ids = this.filteredVisitors().map(v => v.id);
        this.selectedVisitorIds.set(new Set(ids));
      } else {
        this.selectedVisitorIds.set(new Set());
      }
    }

    isAllSelected(): boolean {
      const filtered = this.filteredVisitors();
      if (filtered.length === 0) return false;
      return filtered.every(v => this.selectedVisitorIds().has(v.id));
    }

    isSomeSelected(): boolean {
      const filtered = this.filteredVisitors();
      const selectedCount = filtered.filter(v => this.selectedVisitorIds().has(v.id)).length;
      return selectedCount > 0 && selectedCount < filtered.length;
    }

    navigateToSendEmail() {
      const ids = Array.from(this.selectedVisitorIds());
      if (ids.length === 0) {
        this.showToast('Please select at least one visitor to send email.', 'error');
        return;
      }
      this.router.navigate(['/email-campaigns'], {
        queryParams: { visitorIds: ids.join(',') }
      });
    }

  openCardViewer(visitor: Visitor, event: Event) {
    event.stopPropagation();

    // Ensure only card viewer opens, not Visitor Insights (record preview)
    this.selectedVisitor.set(null);
    this.editingVisitor.set(null);

    this.selectedCardVisitor.set(visitor);
    this.isImageViewerOpen.set(true);
    this.zoomLevel.set(1);
  }

    closeReview() {
      this.stopAudio();
      this.selectedVisitor.set(null);
      this.isUpdatingVisitorCard.set(false);
      this.isUpdatingVoiceNote.set(false);
    }

  isImageViewerOpen = signal<boolean>(false);
  zoomLevel = signal<number>(1);

  ngOnInit() {
    this.initForm();
    this.loadProductInterests();
    this.visitorsService.getVisitors().subscribe({
      next: (data) => {
        const initializedData = data.map(v => ({
          ...v,
          alternate_mobile: v.alternate_mobile || null,
          office_number: v.office_number || null,
          lead_category: v.lead_category || null
        }));
        this.visitors.set(initializedData);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching visitors', err);
        this.error.set('Failed to load visitors.');
        this.loading.set(false);
      }
    });

    this.venueService.getVenues().subscribe({
      next: (data: Venue[]) => this.venues.set(this.uniqueVenues(data)),
      error: (err: any) => console.error('Error fetching venues', err)
    });

    this.loadLeadCategories();
    this.loadDepartments();
  }

  private loadLeadCategories() {
    this.leadCategoryService.getActiveLeadCategories().subscribe({
      next: (items) => {
        const categories = items.map(item => item.name);
        this.leadCategories.set(categories);

        // Only set default category if categories exist and form is pristine
        if (categories.length > 0 && this.addVisitorForm.get('leadCategory')?.pristine) {
          this.addVisitorForm.patchValue({
            leadCategory: categories[0]
          });
        }
      },
      error: (err) => {
        console.error('Error loading lead categories', err);
        this.leadCategories.set([]);
        // Don't set a default category on error - let it remain empty
      }
    });
  }

  private loadDepartments() {
    this.departmentService.getActiveDepartments().subscribe({
      next: (items) => {
        this.departments.set(items.map(item => item.name));
      },
      error: (err) => {
        console.error('Error loading departments', err);
        this.departments.set([]);
      }
    });
  }

  openImageViewer() {
    this.isImageViewerOpen.set(true);
    this.zoomLevel.set(1);
  }

  closeImageViewer() {
    this.isImageViewerOpen.set(false);
    this.zoomLevel.set(1);
  }

  private loadProductInterests() {
    this.productsService.getActiveProducts().subscribe({
      next: (products) => {
        const productNames = products.map(product => product.name);
        this.productInterests = productNames.length ? productNames : INTEREST_OPTIONS.map(option => option.value);
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.productInterests = INTEREST_OPTIONS.map(option => option.value);
      }
    });
  }

  onReviewCardSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      this.showToast('Only PNG and JPG images are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('File size should not exceed 5MB.', 'error');
      return;
    }

    const visitor = this.selectedVisitor();
    if (!visitor) return;

    this.isUpdatingVisitorCard.set(true);
    this.visitorsService.updateVisitorCard(visitor.id, file).subscribe({
      next: (response) => {
        const updatedVisitor = { ...visitor, visiting_card_url: response.visitingCardUrl };
        this.selectedVisitor.set(updatedVisitor);
        this.visitors.update(vs => vs.map(v => v.id === visitor.id ? updatedVisitor : v));
        this.showToast('Visiting card 1 updated successfully', 'success');
        this.isUpdatingVisitorCard.set(false);
        this.scanVisitingCardForDetails(file, (details) => {
          const withDetails = { ...updatedVisitor, details };
          this.selectedVisitor.set(withDetails);
          this.visitors.update(vs => vs.map(v => v.id === visitor.id ? withDetails : v));
          this.visitorsService.updateVisitor(visitor.id, { details }).subscribe();
        });
      },
      error: (err) => {
        console.error('Failed to update visiting card', err);
        this.showToast('Failed to update visiting card', 'error');
        this.isUpdatingVisitorCard.set(false);
      }
    });
  }

  onEditCardSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      this.showToast('Only PNG and JPG images are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('File size should not exceed 5MB.', 'error');
      return;
    }

    const visitor = this.editingVisitor();
    if (!visitor) return;

    this.isUpdatingVisitorCard.set(true);
    this.visitorsService.updateVisitorCard(visitor.id, file).subscribe({
      next: (response) => {
        const updatedVisitor = { ...visitor, ...this.editFormData(), visiting_card_url: response.visitingCardUrl } as Visitor;
        this.editingVisitor.set(updatedVisitor);
        this.editFormData.set({ ...this.editFormData(), visiting_card_url: response.visitingCardUrl });
        this.visitors.update(vs => vs.map(v => v.id === visitor.id ? updatedVisitor : v));
        this.showToast('Visiting card 1 updated successfully', 'success');
        this.isUpdatingVisitorCard.set(false);
        this.scanVisitingCardForDetails(file, (details) => {
          this.editFormData.set({ ...this.editFormData(), details });
        });
      },
      error: (err) => {
        console.error('Failed to update visiting card', err);
        this.showToast('Failed to update visiting card', 'error');
        this.isUpdatingVisitorCard.set(false);
      }
    });
  }

  onEditCardSelected2(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      this.showToast('Only PNG and JPG images are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('File size should not exceed 5MB.', 'error');
      return;
    }

    this.uploadCapturedVisitingCard(file, 2);
  }

  async openVisitingCardCamera(slot: 1 | 2) {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.showToast('Camera access is not supported in this browser.', 'error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.cameraStream.set(stream);
      this.cameraModalSlot.set(slot);
      this.capturedCardPreview.set(null);
    } catch (error) {
      console.error('Unable to access camera', error);
      this.showToast('Unable to access webcam. Please check camera permissions.', 'error');
      this.closeVisitingCardCamera();
    }
  }

  closeVisitingCardCamera() {
    this.cameraModalSlot.set(null);
    this.capturedCardPreview.set(null);
    this.stopVisitingCardCamera();
  }

  private stopVisitingCardCamera() {
    const stream = this.cameraStream();
    if (!stream) return;
    stream.getTracks().forEach(track => track.stop());
    this.cameraStream.set(null);
  }

  captureVisitingCardFromCamera(video: HTMLVideoElement) {
    if (!video.videoWidth || !video.videoHeight) {
      this.showToast('Camera stream is not ready yet.', 'error');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.showToast('Unable to capture image from camera.', 'error');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        this.showToast('Unable to capture image from camera.', 'error');
        return;
      }

      const file = new File([blob], `visiting-card-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const slot = this.cameraModalSlot();
      if (slot) {
        if (this.editingVisitor()) {
          this.uploadCapturedVisitingCard(file, slot);
        } else {
          if (slot === 1) {
            this.onVisitingCard1File(file);
          } else {
            this.onVisitingCard2File(file);
          }
        }
      }
      this.closeVisitingCardCamera();
    }, 'image/jpeg', 0.92);
  }

  private uploadCapturedVisitingCard(file: File, slot: 1 | 2) {
    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      this.showToast('Only PNG and JPG images are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('File size should not exceed 5MB.', 'error');
      return;
    }

    const visitor = this.editingVisitor();
    if (!visitor) return;

    const updateMethod: Observable<{ visitingCardUrl: string | null } | { visitingCardUrl2: string | null }> =
      slot === 1 ? this.visitorsService.updateVisitorCard(visitor.id, file) : this.visitorsService.updateVisitorCard2(visitor.id, file);
    const updatingSignal = slot === 1 ? this.isUpdatingVisitorCard : this.isUpdatingVisitorCard2;
    updatingSignal.set(true);

    updateMethod.subscribe({
      next: (response) => {
        const patch = slot === 1
          ? { visiting_card_url: (response as { visitingCardUrl: string | null }).visitingCardUrl }
          : { visiting_card_url_2: (response as { visitingCardUrl2: string | null }).visitingCardUrl2 };
        const updatedVisitor = { ...visitor, ...this.editFormData(), ...patch } as Visitor;
        this.editingVisitor.set(updatedVisitor);
        this.editFormData.set({ ...this.editFormData(), ...patch });
        this.visitors.update(vs => vs.map(v => v.id === visitor.id ? updatedVisitor : v));
        this.showToast(`Visiting card ${slot} updated successfully`, 'success');
        updatingSignal.set(false);

        if (slot === 1) {
          this.scanVisitingCardForDetails(file, (details) => {
            this.editFormData.set({ ...this.editFormData(), details });
          });
        }
      },
      error: (err: unknown) => {
        console.error(`Failed to update visiting card ${slot}`, err);
        this.showToast(`Failed to update visiting card ${slot}`, 'error');
        updatingSignal.set(false);
      }
    });
  }

  private async scanVisitingCardForDetails(file: File, onDetails: (details: string) => void) {
    let worker: any;
    try {
      const { createWorker, PSM } = await import('tesseract.js');
      worker = await createWorker('eng', 1);
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        preserve_interword_spaces: '1'
      });
      const result = await worker.recognize(file);
      const details = (result.data.text || '').replace(/\s+/g, ' ').trim();
      if (details) {
        onDetails(details);
      }
    } catch (error) {
      console.error('Visiting card details scan failed', error);
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }

  onEditVoiceNoteSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('audio/') && file.type !== 'video/webm') {
      this.showToast('Only audio files are allowed.', 'error');
      return;
    }

    this.uploadVoiceNoteFile(file, 1);
  }

  removeEditVoiceNote(event: Event) {
    event.stopPropagation();
    const visitor = this.editingVisitor();
    if (!visitor || !this.editFormData().voice_note_url || this.isUpdatingVoiceNote()) return;

    this.isUpdatingVoiceNote.set(true);
    this.visitorsService.removeVisitorVoiceNote(visitor.id).subscribe({
      next: (response) => {
        const updatedVisitor = { ...visitor, ...this.editFormData(), voice_note_url: response.voiceNoteUrl } as Visitor;
        this.editingVisitor.set(updatedVisitor);
        this.editFormData.set({ ...this.editFormData(), voice_note_url: response.voiceNoteUrl });
        this.visitors.update(vs => vs.map(v => v.id === visitor.id ? updatedVisitor : v));
        this.showToast('Voice note removed successfully', 'success');
        this.isUpdatingVoiceNote.set(false);
      },
      error: (err) => {
        console.error('Failed to remove voice note', err);
        this.showToast('Failed to remove voice note', 'error');
        this.isUpdatingVoiceNote.set(false);
      }
    });
  }

  onEditVoiceNoteSelected2(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('audio/') && file.type !== 'video/webm') {
      this.showToast('Only audio files are allowed.', 'error');
      return;
    }

    this.uploadVoiceNoteFile(file, 2);
  }

  removeEditVoiceNote2(event: Event) {
    event.stopPropagation();
    const visitor = this.editingVisitor();
    if (!visitor || !this.editFormData().voice_note_url_2 || this.isUpdatingVoiceNote2()) return;

    this.isUpdatingVoiceNote2.set(true);
    this.visitorsService.removeVisitorVoiceNote2(visitor.id).subscribe({
      next: (response) => {
        const updatedVisitor = { ...visitor, ...this.editFormData(), voice_note_url_2: response.voiceNoteUrl2 } as Visitor;
        this.editingVisitor.set(updatedVisitor);
        this.editFormData.set({ ...this.editFormData(), voice_note_url_2: response.voiceNoteUrl2 });
        this.visitors.update(vs => vs.map(v => v.id === visitor.id ? updatedVisitor : v));
        this.showToast('Voice note 2 removed successfully', 'success');
        this.isUpdatingVoiceNote2.set(false);
      },
      error: (err) => {
        console.error('Failed to remove voice note 2', err);
        this.showToast('Failed to remove voice note 2', 'error');
        this.isUpdatingVoiceNote2.set(false);
      }
    });
  }

  removeEditVisitorCard(event: Event) {
    event.stopPropagation();
    const visitor = this.editingVisitor();
    const currentCardUrl = this.editFormData().visiting_card_url;
    if (!visitor || !currentCardUrl || this.isUpdatingVisitorCard()) return;

    this.isUpdatingVisitorCard.set(true);
    this.visitorsService.removeVisitorCard(visitor.id).subscribe({
      next: (response) => {
        const updatedVisitor = { ...visitor, ...this.editFormData(), visiting_card_url: response.visitingCardUrl } as Visitor;
        this.editingVisitor.set(updatedVisitor);
        this.editFormData.set({ ...this.editFormData(), visiting_card_url: response.visitingCardUrl });
        this.visitors.update(vs => vs.map(v => v.id === visitor.id ? updatedVisitor : v));
        this.showToast('Visiting card 1 removed successfully', 'success');
        this.isUpdatingVisitorCard.set(false);
      },
      error: (err) => {
        console.error('Failed to remove visiting card', err);
        this.showToast('Failed to remove visiting card', 'error');
        this.isUpdatingVisitorCard.set(false);
      }
    });
  }

  removeEditVisitorCard2(event: Event) {
    event.stopPropagation();
    const visitor = this.editingVisitor();
    const currentCardUrl = this.editFormData().visiting_card_url_2;
    if (!visitor || !currentCardUrl || this.isUpdatingVisitorCard2()) return;

    this.isUpdatingVisitorCard2.set(true);
    this.visitorsService.removeVisitorCard2(visitor.id).subscribe({
      next: (response) => {
        const updatedVisitor = { ...visitor, ...this.editFormData(), visiting_card_url_2: response.visitingCardUrl2 } as Visitor;
        this.editingVisitor.set(updatedVisitor);
        this.editFormData.set({ ...this.editFormData(), visiting_card_url_2: response.visitingCardUrl2 });
        this.visitors.update(vs => vs.map(v => v.id === visitor.id ? updatedVisitor : v));
        this.showToast('Visiting card 2 removed successfully', 'success');
        this.isUpdatingVisitorCard2.set(false);
      },
      error: (err) => {
        console.error('Failed to remove visiting card 2', err);
        this.showToast('Failed to remove visiting card 2', 'error');
        this.isUpdatingVisitorCard2.set(false);
      }
    });
  }

  removeVisitorCard(event: Event) {
    event.stopPropagation();
    const visitor = this.selectedVisitor();
    if (!visitor || !visitor.visiting_card_url || this.isUpdatingVisitorCard()) return;

    this.isUpdatingVisitorCard.set(true);
    this.visitorsService.removeVisitorCard(visitor.id).subscribe({
      next: (response) => {
        const updatedVisitor = { ...visitor, visiting_card_url: response.visitingCardUrl };
        this.selectedVisitor.set(updatedVisitor);
        this.visitors.update(vs => vs.map(v => v.id === visitor.id ? updatedVisitor : v));
        this.closeImageViewer();
        this.showToast('Visiting card removed successfully', 'success');
        this.isUpdatingVisitorCard.set(false);
      },
      error: (err) => {
        console.error('Failed to remove visiting card', err);
        this.showToast('Failed to remove visiting card', 'error');
        this.isUpdatingVisitorCard.set(false);
      }
    });
  }

  zoomIn() {
    this.zoomLevel.update(z => Math.min(z + 0.25, 3));
  }

  zoomOut() {
    this.zoomLevel.update(z => Math.max(z - 0.25, 0.5));
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${environment.baseUrl}${url}`;
  }

  getVenueDetails(venueId: string | undefined | null): { venue: string, city: string, year: string } {
    const defaultRes = { venue: '-', city: '-', year: '-' };
    if (!venueId) return defaultRes;
    const v = this.venues().find(ven => ven.venue_id === venueId);
    if (!v || !v.venue) return defaultRes;
    const parts = v.venue.split('-');
    if (parts.length >= 3) {
      const year = parts[parts.length - 1];
      const city = parts[parts.length - 2];
      const venue = parts.slice(0, parts.length - 2).join('-');
      return { venue, city, year };
    }
    return { venue: v.venue, city: '-', year: '-' };
  }

  private uniqueVenues(venues: Venue[]): Venue[] {
    const seen = new Set<string>();
    return venues.filter(venue => {
      const key = String(venue.venue || '')
        .split('-')
        .map(part => part.trim().replace(/\s+/g, ' '))
        .join('-')
        .toLowerCase();

      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private sortRows<T>(rows: T[], valueGetter: (row: T, index: number) => string | number): T[] {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const indexed = rows.map((row, index) => ({ row, index }));

    indexed.sort((a, b) => {
      const aValue = key === 'serial' ? a.index : valueGetter(a.row, a.index);
      const bValue = key === 'serial' ? b.index : valueGetter(b.row, b.index);
      const comparison = typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue || '').localeCompare(String(bValue || ''), undefined, { numeric: true, sensitivity: 'base' });

      return direction === 'asc' ? comparison : -comparison;
    });

    return indexed.map(item => item.row);
  }

  private getVisitorSortValue(visitor: Visitor): string | number {
    const venue = this.getVenueDetails(visitor.venue_id);

    switch (this.sortKey()) {
      case 'name':
        return `${visitor.title || ''} ${visitor.full_name || ''}`.trim();
      case 'company':
        return visitor.company_name || '';
      case 'venue':
        return `${venue.venue} ${venue.city} ${venue.year}`;
      case 'contact':
        return `${visitor.email || ''} ${visitor.mobile || ''} ${visitor.office_number || ''}`;
      case 'lead':
        return visitor.lead_category || '';
      case 'department':
        return visitor.department || '';
      case 'voice':
        return visitor.voice_note_url ? 1 : 0;
      default:
        return '';
    }
  }
}