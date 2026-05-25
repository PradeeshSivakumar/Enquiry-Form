import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}
