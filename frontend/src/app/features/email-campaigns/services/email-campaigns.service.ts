import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CampaignTemplate {
  id?: number;
  name: string;
  subject: string;
  body: string;
  created_at?: string;
}

export interface Campaign {
  id: number;
  name: string;
  subject: string;
  body: string;
  template_id?: number | null;
  sent_count: number;
  failed_count: number;
  open_count: number;
  created_at: string;
}

export interface CampaignRecipient {
  id: number;
  visitor_id: number;
  visitor_name?: string;
  email: string;
  status: 'Delivered' | 'Opened' | 'Failed';
  opened_at?: string | null;
  error_message?: string | null;
  sent_at: string;
}

export interface CampaignDetails extends Campaign {
  recipients: CampaignRecipient[];
}

export interface CampaignDashboard {
  totalCampaigns: number;
  totalSent: number;
  totalFailed: number;
  openRate: number;
  recentCampaigns: Campaign[];
}

export interface VisitorHistoryResponse {
  lastContacted: string | null;
  history: Array<CampaignRecipient & { campaign_name: string; subject: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class EmailCampaignsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/api/campaigns`;

  getDashboard(): Observable<CampaignDashboard> {
    return this.http.get<CampaignDashboard>(`${this.apiUrl}/dashboard`);
  }

  getCampaigns(
    search = '',
    limit = 10,
    offset = 0,
    sortKey = 'created_at',
    sortDirection = 'DESC'
  ): Observable<{ campaigns: Campaign[]; total: number }> {
    const params = new HttpParams()
      .set('search', search)
      .set('limit', limit.toString())
      .set('offset', offset.toString())
      .set('sortKey', sortKey)
      .set('sortDirection', sortDirection);
    return this.http.get<{ campaigns: Campaign[]; total: number }>(this.apiUrl, { params });
  }

  getCampaignById(id: number): Observable<CampaignDetails> {
    return this.http.get<CampaignDetails>(`${this.apiUrl}/${id}`);
  }

  getTemplates(): Observable<CampaignTemplate[]> {
    return this.http.get<CampaignTemplate[]>(`${this.apiUrl}/templates`);
  }

  createTemplate(template: CampaignTemplate): Observable<CampaignTemplate> {
    return this.http.post<CampaignTemplate>(`${this.apiUrl}/templates`, template);
  }

  updateTemplate(id: number, template: CampaignTemplate): Observable<CampaignTemplate> {
    return this.http.put<CampaignTemplate>(`${this.apiUrl}/templates/${id}`, template);
  }

  deleteTemplate(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/templates/${id}`);
  }

  sendCampaign(data: {
    name: string;
    subject: string;
    body: string;
    templateId?: number | null;
    visitorIds: number[];
  }): Observable<{ success: boolean; campaignId: number; stats: { sent: number; failed: number; opened: number } }> {
    return this.http.post<{ success: boolean; campaignId: number; stats: { sent: number; failed: number; opened: number } }>(
      `${this.apiUrl}/send`,
      data
    );
  }

  getVisitorHistory(visitorId: number): Observable<VisitorHistoryResponse> {
    return this.http.get<VisitorHistoryResponse>(`${this.apiUrl}/visitor-history/${visitorId}`);
  }
}
