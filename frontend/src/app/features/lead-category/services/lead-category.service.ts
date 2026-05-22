import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LeadCategory {
  id: number;
  name: string;
  description: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LeadCategoryService {
  private readonly apiUrl = `${environment.baseUrl}/api/lead-categories`;

  constructor(private http: HttpClient) {}

  getLeadCategories(search = ''): Observable<LeadCategory[]> {
    const params = new HttpParams().set('search', search);
    return this.http.get<LeadCategory[]>(this.apiUrl, { params });
  }

  getActiveLeadCategories(): Observable<LeadCategory[]> {
    return this.http.get<LeadCategory[]>(`${this.apiUrl}/active`);
  }

  createLeadCategory(leadCategory: { name: string; description?: string | null }): Observable<any> {
    return this.http.post(this.apiUrl, leadCategory);
  }

  updateLeadCategory(id: number, leadCategory: { name: string; description?: string | null }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, leadCategory);
  }

  deleteLeadCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
