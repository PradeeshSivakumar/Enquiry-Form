import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Venue {
  id?: number;
  venue_id?: string;
  venue: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VenueService {
  private http = inject(HttpClient);
  private apiUrl = environment.baseUrl + '/api/venues';

  getVenues(): Observable<Venue[]> {
    return this.http.get<Venue[]>(this.apiUrl);
  }

  addVenue(venue: Venue): Observable<{ id: number, venue_id: string, message: string }> {
    return this.http.post<{ id: number, venue_id: string, message: string }>(this.apiUrl, venue);
  }

  updateVenue(id: number, venue: Venue): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, venue);
  }

  deleteVenue(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
