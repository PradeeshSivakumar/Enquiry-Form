import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Visitor, VisitorsService } from '../../services/visitors.service';
import { Venue, VenueService } from '../../../venue/services/venue.service';
import { ProductsService } from '../../../products/services/products.service';
import { INTEREST_OPTIONS } from '../../../../core/constants/form-options';
import { environment } from '../../../../../environments/environment';

export type LeadCategory = 'Potential' | 'Non Potential' | 'Others';

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './visitors-page.html',
  styleUrl: './visitors-page.css',
})
export class VisitorsPage implements OnInit {
  private visitorsService = inject(VisitorsService);
  private venueService = inject(VenueService);
  private productsService = inject(ProductsService);
  private fb = inject(FormBuilder);

  visitors = signal<Visitor[]>([]);
  venues = signal<Venue[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  viewMode = signal<'grid' | 'table'>('table');
  selectedVisitor = signal<Visitor | null>(null);
  
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
  filePreview = signal<string | null>(null);
  isScanningCard = signal<boolean>(false);
  cardScanMessage = signal<string | null>(null);
  private cardScanToken = 0;
  isUpdatingVisitorCard = signal<boolean>(false);
  
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
  expandedAudioId = signal<number | null>(null);
  
  // Voice Note Custom Player State
  activeAudio = signal<HTMLAudioElement | null>(null);
  audioState = signal<{
    id: number | null,
    isPlaying: boolean,
    progress: number,
    currentTime: number,
    duration: number,
    isLoading: boolean,
    hasError: boolean
  }>({
    id: null,
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
  
  searchQuery = signal<string>('');
  activeCategory = signal<string>('All');
  activeDepartment = signal<string>('');
  
  leadCategories = [
    'Potential', 'Non Potential', 'Others'
  ];

  titles = ['Mr', 'Ms', 'Mrs', 'Dr'];
  jobTitles = ['CEO', 'CTO', 'Manager', 'Engineer', 'Developer', 'Sales Executive', 'Consultant', 'Other'];
  departments = ['Engineering', 'Sales', 'Marketing', 'Operations', 'Management', 'HR', 'IT', 'Finance', 'Others'];
  productInterests = INTEREST_OPTIONS.map(option => option.value);

  filterTabs = ['All', 'Potential', 'Non Potential', 'Others'];

  // Pagination
  pageSize = signal<number>(5);
  currentPage = signal<number>(1);

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
        (v.department?.toLowerCase().includes(query)) ||
        (v.interests?.some(i => i.toLowerCase().includes(query)))
      );
    }
    
    return result;
  });

  // Analytics Metrics
  totalVisitors = computed(() => this.visitors().length);
  potentialLeads = computed(() => this.visitors().filter(v => v.lead_category === 'Potential').length);
  nonPotentialLeads = computed(() => this.visitors().filter(v => v.lead_category === 'Non Potential').length);
  otherLeads = computed(() => this.visitors().filter(v => v.lead_category === 'Others').length);

  totalPages = computed(() => {
    const total = this.filteredVisitors().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  paginatedVisitors = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredVisitors().slice(start, end);
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
    this.editingVisitor.set(visitor);
    this.editFormData.set({ ...visitor });
    this.isUpdatingVisitorCard.set(false);
  }

  closeEdit() {
    this.editingVisitor.set(null);
    this.editFormData.set({});
    this.isUpdatingVisitorCard.set(false);
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
      department: [''],
      leadCategory: ['Potential'],
      venueId: ['', Validators.required],
      remarks: ['', Validators.maxLength(500)]
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

  onFileSelected(event: any) {
    const file = event.target.files[0] as File;
    if (file) {
      if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
        this.showToast('Only PNG and JPG images are allowed.', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('File size should not exceed 5MB.', 'error');
        return;
      }
      
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.filePreview.set(e.target.result);
      };
      reader.readAsDataURL(file);
      this.scanVisitingCard(file);
    }
  }

  removeFile() {
    this.selectedFile.set(null);
    this.filePreview.set(null);
    this.isScanningCard.set(false);
    this.cardScanMessage.set(null);
    this.cardScanToken++;
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

      const extracted = this.extractVisitingCardData(result.data.text || '');
      const filledCount = this.applyExtractedCardData(extracted);

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

  private applyExtractedCardData(data: ExtractedVisitingCardData): number {
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

    const extraDetails = [
      data.website ? `Website: ${data.website}` : '',
      data.address ? `Address: ${data.address}` : ''
    ].filter(Boolean).join('\n');
    fillIfEmpty('remarks', extraDetails);

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

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  playAudio(visitor: Visitor, event: Event) {
    event.stopPropagation();
    
    // If clicking the same one that is already expanded
    if (this.audioState().id === visitor.id) {
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
    
    // If missing URL
    if (!visitor.voice_note_url) {
      this.audioState.set({ ...this.audioState(), id: visitor.id, hasError: true });
      return;
    }

    // Create new audio element
    const url = this.getImageUrl(visitor.voice_note_url);
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
      isPlaying: false,
      progress: 0,
      currentTime: 0,
      duration: 0,
      isLoading: false,
      hasError: false
    });
    this.expandedAudioId.set(null);
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

  toggleAudioPlayback(id: number, event: Event) {
    event.stopPropagation();
    if (this.expandedAudioId() === id) {
      this.stopAudio();
    } else {
      // Find the visitor
      const visitor = this.visitors().find(v => v.id === id);
      if (visitor) {
        this.playAudio(visitor, event);
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
    if (formValues.companyName) formData.append('companyName', formValues.companyName);
    if (formValues.jobTitle) formData.append('jobTitle', formValues.jobTitle);
    if (formValues.department) formData.append('department', formValues.department);
    if (formValues.leadCategory) formData.append('leadCategory', formValues.leadCategory);
    if (formValues.venueId) formData.append('venueId', formValues.venueId);
    if (formValues.remarks) formData.append('remarks', formValues.remarks);
    
    formData.append('interests', JSON.stringify(this.selectedInterests()));
    
    const file = this.selectedFile();
    if (file) {
      formData.append('visitingCard', file);
    }
    
    const voiceBlob = this.recordingBlob();
    if (voiceBlob) {
      const voiceFile = new File([voiceBlob], `voicenote-${Date.now()}.webm`, { type: 'audio/webm' });
      formData.append('voiceNote', voiceFile);
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
          department: response.payload.department,
          interests: response.payload.interests,
          visiting_card_url: response.payload.visitingCardUrl,
          voice_note_url: response.payload.voiceNoteUrl,
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

    const headers = ['Visitor Name', 'Company Name', 'Email', 'Mobile', 'Department', 'Lead Category', 'Created Date'];
    
    const rows = data.map(v => {
      const name = (v.title ? v.title + ' ' : '') + v.full_name;
      const date = new Date(v.created_at).toLocaleDateString();
      return `"${name}","${v.company_name || ''}","${v.email}","${v.mobile}","${v.department || ''}","${v.lead_category || 'Potential'}","${date}"`;
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
  }

  closeReview() {
    this.stopAudio();
    this.selectedVisitor.set(null);
    this.isUpdatingVisitorCard.set(false);
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
          lead_category: v.lead_category || 'Potential'
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
      next: (data: Venue[]) => this.venues.set(data),
      error: (err: any) => console.error('Error fetching venues', err)
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
        this.showToast('Visiting card updated successfully', 'success');
        this.isUpdatingVisitorCard.set(false);
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
        this.showToast('Visiting card updated successfully', 'success');
        this.isUpdatingVisitorCard.set(false);
      },
      error: (err) => {
        console.error('Failed to update visiting card', err);
        this.showToast('Failed to update visiting card', 'error');
        this.isUpdatingVisitorCard.set(false);
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
}
