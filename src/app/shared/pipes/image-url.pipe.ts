import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({ name: 'imageUrl', standalone: true })
export class ImageUrlPipe implements PipeTransform {
  transform(path: string | null | undefined): string {
    if (path == null || path === '') {
      return 'assets/placeholder-product.svg';
    }
    if (path.startsWith('http')) {
      return path;
    }
    const base = environment.apiUrl.replace(/\/$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  }
}
