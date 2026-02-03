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
  CategoryDTO,
  SpecEntryDTO,
  ApiResponse,
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

  getCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.base}/public/categories`);
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

  create(body: ProductCreate): Observable<ApiResponse<ProductDTO>> {
    return this.http.post<ApiResponse<ProductDTO>>(
      `${this.base}/admin/products`,
      body
    );
  }

  update(id: number, body: ProductUpdate): Observable<ApiResponse<ProductDTO>> {
    return this.http.put<ApiResponse<ProductDTO>>(
      `${this.base}/admin/products/${id}`,
      body
    );
  }

  delete(id: number): Observable<ApiResponse<{ id: number }>> {
    return this.http.delete<ApiResponse<{ id: number }>>(
      `${this.base}/admin/products/${id}`
    );
  }

  uploadImages(
    productId: number,
    files: File[]
  ): Observable<ApiResponse<{ productId: number; uploadedCount: number }>> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return this.http.post<
      ApiResponse<{ productId: number; uploadedCount: number }>
    >(`${this.base}/admin/products/${productId}/images`, formData);
  }

  addSpecifications(
    productId: number,
    body: SpecEntryDTO[]
  ): Observable<ApiResponse<{ productId: number; addedCount: number }>> {
    return this.http.post<
      ApiResponse<{ productId: number; addedCount: number }>
    >(`${this.base}/admin/products/${productId}/specifications`, body);
  }
}
