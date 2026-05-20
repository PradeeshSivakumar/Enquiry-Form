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
  office_number: string | null;
  department: string | null;
  interests: string[];
  visiting_card_url: string | null;
  voice_note_url?: string | null;
  venue_id?: string | null;
  remarks: string | null;
  created_at: string;
  lead_category?: string;
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

  removeVisitorCard(id: number): Observable<{ visitingCardUrl: string | null }> {
    return this.http.delete<{ visitingCardUrl: string | null }>(`${this.apiUrl}/${id}/visiting-card`);
  }

  deleteVisitor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
