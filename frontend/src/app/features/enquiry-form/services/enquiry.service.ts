import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnquiryFormData, EnquiryPayload } from '../interfaces/enquiry-form-data.interface';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EnquiryService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  submitEnquiry(data: EnquiryFormData): Observable<{ success: boolean; payload: EnquiryPayload }> {
    const formData = new FormData();
    formData.append('title', data.title ?? '');
    formData.append('fullName', data.fullName);
    formData.append('companyName', data.companyName ?? '');
    formData.append('jobTitle', data.jobTitle ?? '');
    formData.append('email', data.email);
    formData.append('mobile', data.mobile);
    formData.append('department', data.department ?? '');
    formData.append('interests', JSON.stringify(data.interests));
    formData.append('venueId', data.venueId ?? '');
    formData.append('remarks', data.remarks ?? '');

    if (data.visitingCard) {
      formData.append('visitingCard', data.visitingCard);
    }
    
    if (data.voiceNote) {
      formData.append('voiceNote', data.voiceNote);
    }

    return this.http.post<{ success: boolean; payload: EnquiryPayload }>(this.apiUrl, formData);
  }

  uploadVisitingCard(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('visitingCard', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/visiting-card`, formData);
  }
}
