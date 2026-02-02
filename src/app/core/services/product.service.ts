import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ProductListDTO,
  ProductDetailDTO,
  ProductDTO,
  PageResponse,
  ProductCreate,
  ProductUpdate,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly base = `${this.apiUrl}/api`;

  getProducts(): Observable<ProductListDTO[]> {
    return this.http.get<ProductListDTO[]>(`${this.base}/public/products`);
  }

  getDetail(id: number): Observable<ProductDetailDTO> {
    return this.http.get<ProductDetailDTO>(`${this.base}/public/products/detail/${id}`);
  }

  getProductById(id: number): Observable<ProductDTO> {
    return this.http.get<ProductDTO>(`${this.base}/public/products/${id}`);
  }

  search(name: string, page: number, size: number): Observable<PageResponse<ProductDTO>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (name.trim()) {
      params = params.set('name', name.trim());
    }
    return this.http.get<PageResponse<ProductDTO>>(`${this.base}/public/products/search`, {
      params,
    });
  }

  create(body: ProductCreate): Observable<ProductDTO> {
    return this.http.post<ProductDTO>(`${this.base}/admin/products`, body);
  }

  update(id: number, body: ProductUpdate): Observable<ProductDTO> {
    return this.http.put<ProductDTO>(`${this.base}/admin/products/${id}`, body);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/admin/products/${id}`, {
      responseType: 'text',
    });
  }

  uploadImages(productId: number, files: File[]): Observable<void> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return this.http.post<void>(
      `${this.base}/admin/products/${productId}/images`,
      formData
    );
  }
}
