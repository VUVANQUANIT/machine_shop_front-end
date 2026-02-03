export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface ProductDTO {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  quantity: number;
  price: number;
  status: ProductStatus;
  categoryId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListDTO {
  id: number;
  name: string;
  price: number;
  thumbnail: string | null;
}

export interface SpecEntryDTO {
  specKey: string;
  specValue: string;
}

export interface ProductDetailDTO {
  id: number;
  name: string;
  price: number;
  images: string[];
  categoryName: string | null;
  specifications?: SpecEntryDTO[];
}

export interface CategoryDTO {
  id: number;
  name: string;
}

/** Response chuẩn API admin (success, message, data). */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ProductCreate {
  name: string;
  slug: string;
  description?: string;
  quantity: number;
  price: number;
  status: ProductStatus;
  categoryId: number;
  isActive?: boolean;
}

export interface ProductUpdate {
  name?: string;
  slug?: string;
  description?: string;
  quantity?: number;
  price?: number;
  status?: ProductStatus;
  categoryId?: number;
  isActive?: boolean;
}
