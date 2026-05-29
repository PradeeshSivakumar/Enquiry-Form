import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Visitor {
  id: number;
  title: string | null;
  full_name: string;
  company_name: string | null;
  job_title: string | null;
  email: string;
  mobile: string;
  alternate_mobile?: string | null;
  office_number?: string | null;
  department: string | null;
  interests: string[];
  visiting_card_url: string | null;
  visiting_card_url_2?: string | null;
  details?: string | null;
  voice_note_url?: string | null;
  voice_note_url_2?: string | null;
  venue_id?: string | null;
  remarks: string | null;
  referred_by?: string | null;
  created_at: string;
  lead_category: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class VisitorsService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFilteredVisitors(params: {
    fromDate?: string;
    toDate?: string;
    department?: string;
    product?: string;
    category?: string;
    venue?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Observable<{ visitors: Visitor[]; total: number }> {
    let httpParams = new HttpParams();
    if (params.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params.toDate) httpParams = httpParams.set('toDate', params.toDate);
    if (params.department) httpParams = httpParams.set('department', params.department);
    if (params.product) httpParams = httpParams.set('product', params.product);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.venue) httpParams = httpParams.set('venue', params.venue);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.offset !== undefined) httpParams = httpParams.set('offset', params.offset.toString());

    return this.http.get<{ visitors: Visitor[]; total: number }>(`${this.apiUrl}/filtered`, { params: httpParams });
  }

  getVisitors(): Observable<Visitor[]> {
    return this.http.get<Visitor[]>(this.apiUrl);
  }

  updateCategory(id: number, category: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/category`, { category });
  }

  updateVisitor(id: number, visitorData: Partial<Visitor>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, visitorData);
  }

  createVisitor(visitorData: Partial<Visitor>): Observable<Visitor> {
    return this.http.post<Visitor>(`${this.apiUrl}/admin`, visitorData);
  }

  createVisitorMultipart(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}`, formData);
  }

  updateVisitorCard(id: number, file: File): Observable<{ visitingCardUrl: string | null }> {
    const formData = new FormData();
    formData.append('visitingCard', file);
    return this.http.put<{ visitingCardUrl: string | null }>(`${this.apiUrl}/${id}/visiting-card`, formData);
  }

  updateVisitorCard2(id: number, file: File): Observable<{ visitingCardUrl2: string | null }> {
    const formData = new FormData();
    formData.append('visitingCard2', file);
    return this.http.put<{ visitingCardUrl2: string | null }>(`${this.apiUrl}/${id}/visiting-card-2`, formData);
  }

  updateVisitorVoiceNote(id: number, file: File): Observable<{ voiceNoteUrl: string | null }> {
    const formData = new FormData();
    formData.append('voiceNote', file);
    return this.http.put<{ voiceNoteUrl: string | null }>(`${this.apiUrl}/${id}/voice-note`, formData);
  }

  updateVisitorVoiceNote2(id: number, file: File): Observable<{ voiceNoteUrl2: string | null }> {
    const formData = new FormData();
    formData.append('voiceNote2', file);
    return this.http.put<{ voiceNoteUrl2: string | null }>(`${this.apiUrl}/${id}/voice-note-2`, formData);
  }

  removeVisitorCard(id: number): Observable<{ visitingCardUrl: string | null }> {
    return this.http.delete<{ visitingCardUrl: string | null }>(`${this.apiUrl}/${id}/visiting-card`);
  }

  removeVisitorCard2(id: number): Observable<{ visitingCardUrl2: string | null }> {
    return this.http.delete<{ visitingCardUrl2: string | null }>(`${this.apiUrl}/${id}/visiting-card-2`);
  }

  removeVisitorVoiceNote(id: number): Observable<{ voiceNoteUrl: string | null }> {
    return this.http.delete<{ voiceNoteUrl: string | null }>(`${this.apiUrl}/${id}/voice-note`);
  }

  removeVisitorVoiceNote2(id: number): Observable<{ voiceNoteUrl2: string | null }> {
    return this.http.delete<{ voiceNoteUrl2: string | null }>(`${this.apiUrl}/${id}/voice-note-2`);
  }

  deleteVisitor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  bulkImport(enquiries: any[], options: { skipDuplicates: boolean }): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk`, { enquiries, options });
  }
}
