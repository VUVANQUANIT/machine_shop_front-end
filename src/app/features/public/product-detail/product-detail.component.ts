import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import type { ProductDetailDTO } from '../../../core/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, SkeletonComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  product: ProductDetailDTO | null = null;
  loading = true;
  error: string | null = null;
  selectedImageIndex = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.error = 'Sản phẩm không tồn tại.';
      return;
    }
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      this.loading = false;
      this.error = 'Sản phẩm không tồn tại.';
      return;
    }
    this.productService.getDetail(numId).subscribe({
      next: (res) => {
        this.product = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Không thể tải thông tin sản phẩm.';
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

  get mainImage(): string {
    if (!this.product) return '';
    const images = this.product.images;
    if (images.length === 0) return '';
    return images[this.selectedImageIndex] ?? images[0];
  }
}
