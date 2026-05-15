import { animate, style, transition, trigger } from '@angular/animations';
import { Component, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { DEPARTMENT_OPTIONS, INTEREST_OPTIONS, JOB_TITLE_OPTIONS, TITLE_OPTIONS } from '../../../core/constants/form-options';
import { SidebarBrandComponent } from '../../../layout/sidebar/sidebar-brand.component';
import { CheckboxCardGroupComponent } from '../components/checkbox-card-group.component';
import { CustomInputComponent } from '../components/custom-input.component';
import { CustomSelectComponent } from '../components/custom-select.component';
import { FormSectionComponent } from '../components/form-section.component';
import { PrimaryButtonComponent } from '../components/primary-button.component';
import { TextareaComponent } from '../components/textarea.component';
import { UploadDropzoneComponent } from '../components/upload-dropzone.component';
import { EnquiryService } from '../services/enquiry.service';
import { VenueService, Venue } from '../../venue/services/venue.service';

@Component({
  selector: 'app-enquiry-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SidebarBrandComponent,
    FormSectionComponent,
    CustomInputComponent,
    CustomSelectComponent,
    CheckboxCardGroupComponent,
    UploadDropzoneComponent,
    TextareaComponent,
    PrimaryButtonComponent,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(14px)' }), animate('280ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
    ]),
  ],
  templateUrl: './enquiry-form-page.component.html',
  styleUrl: './enquiry-form-page.component.css',
})
export class EnquiryFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly enquiryService = inject(EnquiryService);
  private readonly venueService = inject(VenueService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly isSubmitting = signal(false);
  readonly imagePreview = signal<string | null>(null);
  readonly submitState = signal<'idle' | 'success' | 'error'>('idle');
  readonly formSubmitted = signal(false);
  readonly completionPercentage = signal(0);

  readonly titleOptions = TITLE_OPTIONS;
  readonly jobTitleOptions = JOB_TITLE_OPTIONS;
  readonly departmentOptions = DEPARTMENT_OPTIONS;
  readonly interestOptions = INTEREST_OPTIONS;

  venues = signal<Venue[]>([]);
  venueOptions = computed(() => this.venues().map(v => ({ value: v.venue_id!, label: v.venue })));

  // Voice Note Recording
  isRecording = signal<boolean>(false);
  recordingTime = signal<number>(0);
  recordingBlob = signal<Blob | null>(null);
  recordingUrl = signal<string | null>(null);
  safeRecordingUrl = computed(() => {
    const url = this.recordingUrl();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  });
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingInterval: any;

  readonly form = this.fb.group({
    venueId: ['', Validators.required],
    title: [''],
    fullName: ['', Validators.required],
    companyName: [''],
    jobTitle: [''],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    department: [''],
    interests: this.fb.array<FormControl<boolean | null>>(this.interestOptions.map(() => this.fb.control(false)), [this.atLeastOneSelectedValidator()]),
    visitingCard: [null as File | null],
    remarks: [''],
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.updateCompletion());

    const savedVenueId = localStorage.getItem('enquiry_venueId');
    if (savedVenueId) this.form.controls.venueId.setValue(savedVenueId);

    // Removed city

    this.form.controls.venueId.valueChanges.pipe(takeUntilDestroyed()).subscribe(val => {
      if (val) localStorage.setItem('enquiry_venueId', val);
      else localStorage.removeItem('enquiry_venueId');
    });



    this.updateCompletion();
    this.loadVenues();
  }

  loadVenues() {
    this.venueService.getVenues().subscribe({
      next: (data) => this.venues.set(data),
      error: (err) => console.error('Failed to load venues', err)
    });
  }

  get interestsArray(): FormArray<FormControl<boolean | null>> {
    return this.form.controls.interests;
  }

  showError(controlName: 'venueId' | 'fullName' | 'email' | 'mobile'): boolean {
    const control = this.form.controls[controlName];
    return !!(control.invalid && (control.touched || this.formSubmitted()));
  }

  showSuccess(controlName: 'venueId' | 'title' | 'fullName' | 'companyName' | 'jobTitle' | 'email' | 'department'): boolean {
    const control = this.form.controls[controlName];
    const value = `${control.value ?? ''}`.trim();
    const optionalFields = new Set(['title', 'companyName', 'jobTitle', 'department']);
    if (optionalFields.has(controlName)) {
      return value.length > 0;
    }
    return value.length > 0 && control.valid;
  }

  onFileSelected(file: File): void {
    if (!file.type.startsWith('image/')) {
      return;
    }
    this.form.controls.visitingCard.setValue(file);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onRemoveFile(): void {
    this.form.controls.visitingCard.setValue(null);
    this.imagePreview.set(null);
  }

  onMobileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, 10);
    if (input.value !== digitsOnly) {
      input.value = digitsOnly;
    }
    this.form.controls.mobile.setValue(digitsOnly, { emitEvent: false });
  }

  startNewEnquiry(): void {
    const venueId = this.form.controls.venueId.value;

    this.submitState.set('idle');
    this.form.reset();

    if (venueId) this.form.controls.venueId.setValue(venueId);

    this.interestsArray.controls.forEach((control) => control.setValue(false));
    this.imagePreview.set(null);
    this.clearVoiceNote();
    this.formSubmitted.set(false);
    this.updateCompletion();
  }

  onSubmit(): void {
    this.formSubmitted.set(true);
    // Clear previous error immediately when user presses submit again
    this.submitState.set('idle');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidControl();
      return;
    }



    const selectedInterests = this.interestsArray.controls
      .map((control, index) => (control.value ? this.interestOptions[index].value : null))
      .filter((value): value is string => !!value);

    this.isSubmitting.set(true);
    this.submitState.set('idle');

    const rawValue = this.form.getRawValue();
    const voiceBlob = this.recordingBlob();
    let voiceNoteData: File | undefined = undefined;
    if (voiceBlob) {
      voiceNoteData = new File([voiceBlob], `voicenote-${Date.now()}.webm`, { type: 'audio/webm' });
    }

    const data = {
      title: rawValue.title ?? undefined,
      fullName: rawValue.fullName ?? '',
      companyName: rawValue.companyName ?? undefined,
      jobTitle: rawValue.jobTitle ?? undefined,
      email: rawValue.email ?? '',
      mobile: rawValue.mobile ?? '',
      department: rawValue.department ?? undefined,
      interests: selectedInterests,
      visitingCard: rawValue.visitingCard,
      voiceNote: voiceNoteData,
      venueId: rawValue.venueId ?? undefined,
      remarks: rawValue.remarks ?? undefined,
    };

    this.enquiryService
      .submitEnquiry(data)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          const venueId = this.form.controls.venueId.value;

          this.submitState.set('success');
          this.form.reset();

          if (venueId) this.form.controls.venueId.setValue(venueId);

          this.interestsArray.controls.forEach((control) => control.setValue(false));
          this.imagePreview.set(null);
          this.clearVoiceNote();
          this.formSubmitted.set(false);
          this.updateCompletion();
        },
        error: (err) => {
          this.submitState.set('error');
          // Helpful for debugging submission payload / backend validation issues
          console.error('Enquiry submission failed:', err);
        },
      });
  }

  private focusFirstInvalidControl(): void {
    const firstInvalid = document.querySelector('[formControlName]:invalid, input[aria-invalid="true"], select[aria-invalid="true"]') as HTMLElement | null;
    firstInvalid?.focus();
    firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private atLeastOneSelectedValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formArray = control as FormArray<FormControl<boolean | null>>;
      return formArray.controls.some((item) => item.value) ? null : { atLeastOneRequired: true };
    };
  }

  private updateCompletion(): void {
    const values = this.form.getRawValue();
    const total = 9;
    const complete = [values.venueId, values.title, values.fullName, values.companyName, values.jobTitle, values.email, values.mobile, values.department, values.remarks].filter(
      (value) => `${value ?? ''}`.trim().length > 0
    ).length;

    this.completionPercentage.set(Math.round((complete / total) * 100));
  }

  progressColor(): string {
    const progress = this.completionPercentage();
    if (progress < 30) {
      return '#94a3b8';
    }
    if (progress < 70) {
      return '#64748b';
    }
    return '#1f1f1f';
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
