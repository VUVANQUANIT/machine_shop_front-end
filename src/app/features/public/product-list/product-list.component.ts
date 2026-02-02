import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import type { ProductListDTO } from '../../../core/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, SkeletonComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);

  products: ProductListDTO[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (res) => {
        this.products = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Không thể tải danh sách sản phẩm.';
        this.loading = false;
      },
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  }
}
