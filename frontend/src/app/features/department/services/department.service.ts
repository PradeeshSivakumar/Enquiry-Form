import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Department {
  id: number;
  name: string;
  description: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly apiUrl = `${environment.baseUrl}/api/departments`;

  constructor(private http: HttpClient) {}

  getDepartments(search = ''): Observable<Department[]> {
    const params = new HttpParams().set('search', search);
    return this.http.get<Department[]>(this.apiUrl, { params });
  }

  getActiveDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/active`);
  }

  createDepartment(department: { name: string; description?: string | null }): Observable<any> {
    return this.http.post(this.apiUrl, department);
  }

  updateDepartment(id: number, department: { name: string; description?: string | null }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, department);
  }

  deleteDepartment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
