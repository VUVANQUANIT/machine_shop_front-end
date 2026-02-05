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

  search(params: {
    keyword?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<ProductListDTO>> {
    let httpParams = new HttpParams();
    if (params.keyword?.trim()) {
      httpParams = httpParams.set('keyword', params.keyword.trim());
    }
    if (params.categoryId !== undefined && params.categoryId !== null) {
      httpParams = httpParams.set('categoryId', params.categoryId);
    }
    if (params.minPrice !== undefined && params.minPrice !== null) {
      httpParams = httpParams.set('minPrice', params.minPrice);
    }
    if (params.maxPrice !== undefined && params.maxPrice !== null) {
      httpParams = httpParams.set('maxPrice', params.maxPrice);
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size);
    }
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    return this.http.get<PageResponse<ProductListDTO>>(`${this.base}/public/products/search`, {
      params: httpParams,
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
