import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import type { ProductListDTO, CategoryDTO, PageResponse } from '../../../core/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, SkeletonComponent, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);

  products = signal<ProductListDTO[]>([]);
  categories = signal<CategoryDTO[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedCategoryId = signal<number | null>(null);
  searchKeywordValue = '';
  sortByValue = 'price,asc';
  pageInfo = signal<{
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  } | null>(null);

  ngOnInit(): void {
    this.loadCategories();
    this.performSearch();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (list) => this.categories.set(list),
      error: () => {},
    });
  }

  performSearch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService
      .search({
        keyword: this.searchKeywordValue || undefined,
        categoryId: this.selectedCategoryId() ?? undefined,
        page: 0,
        size: 12,
        sort: this.sortByValue,
      })
      .subscribe({
        next: (res: PageResponse<ProductListDTO>) => {
          this.products.set(res.content);
          this.pageInfo.set({
            page: res.page,
            size: res.size,
            totalElements: res.totalElements,
            totalPages: res.totalPages,
            first: res.first,
            last: res.last,
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Không thể tải danh sách sản phẩm.');
          this.loading.set(false);
        },
      });
  }

  onCategoryClick(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
    this.performSearch();
  }

  onSearch(): void {
    this.performSearch();
  }

  onSortChange(): void {
    this.performSearch();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  }
}
