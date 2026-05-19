import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Product {
  id?: number;
  product_id?: string;
  name: string;
  category?: string | null;
  description?: string | null;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductPayload {
  name: string;
  category?: string | null;
  description?: string | null;
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private http = inject(HttpClient);
  private apiUrl = environment.baseUrl + '/api/products';

  getProducts(search = '', status = 'all'): Observable<Product[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (status !== 'all') {
      params = params.set('status', status);
    }

    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  getActiveProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/active`);
  }

  addProduct(product: ProductPayload): Observable<{ id: number, product_id: string, message: string }> {
    return this.http.post<{ id: number, product_id: string, message: string }>(this.apiUrl, product);
  }

  updateProduct(id: number, product: ProductPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
