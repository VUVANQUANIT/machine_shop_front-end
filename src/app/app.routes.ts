import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/public/product-list/product-list.component').then(
        (m) => m.ProductListComponent
      ),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/public/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'admin/products',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/product-management/product-management.component').then(
        (m) => m.ProductManagementComponent
      ),
  },
  { path: '**', redirectTo: 'products' },
];
