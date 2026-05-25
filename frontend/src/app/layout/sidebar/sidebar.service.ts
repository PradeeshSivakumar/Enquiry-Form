import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SidebarItem {
  id: number;
  name: string;
  route: string;
  icon: string;
  sort_order: number;
}

export interface SidebarSection {
  id: number;
  name: string;
  sort_order: number;
  items: SidebarItem[];
}

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private readonly apiUrl = `${environment.baseUrl}/api/sidebar`;

  constructor(private http: HttpClient) {}

  getNavigation(): Observable<SidebarSection[]> {
    return this.http.get<SidebarSection[]>(this.apiUrl);
  }
}
