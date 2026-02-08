import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  private readonly platformId = inject(PLATFORM_ID);

  products = signal<ProductListDTO[]>([]);
  categories = signal<CategoryDTO[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedCategoryId = signal<number | null>(null);
  searchKeywordValue = '';
  sortByValue = 'price,asc';
  currentPage = signal(0);
  pageSize = 20;
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

  performSearch(page: number = 0): void {
    this.currentPage.set(page);
    this.loading.set(true);
    this.error.set(null);
    this.productService
      .search({
        keyword: this.searchKeywordValue || undefined,
        categoryId: this.selectedCategoryId() ?? undefined,
        page: page,
        size: this.pageSize,
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
          if (isPlatformBrowser(this.platformId)) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        error: () => {
          this.error.set('Không thể tải danh sách sản phẩm.');
          this.loading.set(false);
        },
      });
  }

  onCategoryClick(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
    this.performSearch(0);
  }

  onSearch(): void {
    this.performSearch(0);
  }

  onSortChange(): void {
    this.performSearch(0);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < (this.pageInfo()?.totalPages ?? 0)) {
      this.performSearch(page);
    }
  }

  getPageNumbers(): number[] {
    const info = this.pageInfo();
    if (!info || info.totalPages <= 1) return [];
    const current = info.page;
    const total = info.totalPages;
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    let end = Math.min(total - 1, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  }
}
