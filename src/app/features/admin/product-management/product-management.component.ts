import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import type {
  ProductListDTO,
  ProductDTO,
  ProductCreate,
  ProductUpdate,
  ProductStatus,
} from '../../../core/models';
import type { ApiError, ValidationError } from '../../../core/models';

const STATUS_OPTIONS: ProductStatus[] = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'];

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUrlPipe, SkeletonComponent],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.scss',
})
export class ProductManagementComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  products = signal<ProductListDTO[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  modalOpen = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  editingId = signal<number | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);
  uploadProductId = signal<number | null>(null);
  uploadFiles = signal<File[]>([]);
  uploadSaving = signal(false);

  statusOptions = STATUS_OPTIONS;

  productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/), Validators.maxLength(250)]],
    description: [''],
    quantity: [0, [Validators.required, Validators.min(0), Validators.max(999999)]],
    price: [0, [Validators.required, Validators.min(0.01), Validators.max(99999999.99)]],
    status: ['ACTIVE' as ProductStatus, [Validators.required]],
    categoryId: [1, [Validators.required, Validators.min(1)]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getProducts().subscribe({
      next: (res) => {
        this.products.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Không thể tải danh sách sản phẩm.');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.formError.set(null);
    this.productForm.reset({
      name: '',
      slug: '',
      description: '',
      quantity: 0,
      price: 0,
      status: 'ACTIVE',
      categoryId: 1,
      isActive: true,
    });
    this.modalOpen.set(true);
  }

  openEdit(id: number): void {
    this.modalMode.set('edit');
    this.editingId.set(id);
    this.formError.set(null);
    this.productService.getProductById(id).subscribe({
      next: (p) => {
        this.productForm.patchValue({
          name: p.name,
          slug: p.slug,
          description: p.description ?? '',
          quantity: p.quantity,
          price: p.price,
          status: p.status,
          categoryId: p.categoryId,
          isActive: p.isActive,
        });
        this.modalOpen.set(true);
        this.cdr.markForCheck();
      },
      error: () => {
        this.error.set('Không thể tải thông tin sản phẩm.');
      },
    });
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.uploadProductId.set(null);
    this.uploadFiles.set([]);
  }

  onSubmit(): void {
    this.formError.set(null);
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    const raw = this.productForm.getRawValue();
    this.saving.set(true);
    const mode = this.modalMode();
    const id = this.editingId();

    if (mode === 'create') {
      const body: ProductCreate = {
        name: raw.name,
        slug: raw.slug,
        description: raw.description || undefined,
        quantity: raw.quantity,
        price: raw.price,
        status: raw.status,
        categoryId: raw.categoryId,
        isActive: raw.isActive,
      };
      this.productService.create(body).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadProducts();
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.formError.set(this.getErrorMessage(err));
        },
      });
    } else if (id !== null) {
      const body: ProductUpdate = {
        name: raw.name,
        slug: raw.slug,
        description: raw.description || undefined,
        quantity: raw.quantity,
        price: raw.price,
        status: raw.status,
        categoryId: raw.categoryId,
        isActive: raw.isActive,
      };
      this.productService.update(id, body).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadProducts();
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.formError.set(this.getErrorMessage(err));
        },
      });
    }
  }

  deleteProduct(id: number, name: string): void {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`)) return;
    this.productService.delete(id).subscribe({
      next: () => this.loadProducts(),
      error: () => this.error.set('Xóa sản phẩm thất bại.'),
    });
  }

  openUpload(id: number): void {
    this.uploadProductId.set(id);
    this.uploadFiles.set([]);
  }

  closeUpload(): void {
    this.uploadProductId.set(null);
    this.uploadFiles.set([]);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files?.length) {
      this.uploadFiles.set(Array.from(files));
    }
  }

  submitUpload(): void {
    const productId = this.uploadProductId();
    const files = this.uploadFiles();
    if (productId === null || files.length === 0) return;
    this.uploadSaving.set(true);
    this.productService.uploadImages(productId, files).subscribe({
      next: () => {
        this.uploadSaving.set(false);
        this.closeUpload();
        this.loadProducts();
      },
      error: (err: ApiError) => {
        this.uploadSaving.set(false);
        this.formError.set(err.message ?? 'Upload ảnh thất bại.');
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

  private getErrorMessage(err: ApiError): string {
    if (err.validationErrors?.length) {
      return err.validationErrors!.map((e: ValidationError) => e.message).join(' ');
    }
    return err.message ?? 'Có lỗi xảy ra.';
  }
}
