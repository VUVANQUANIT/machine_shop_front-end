import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import type { ApiError } from '../models';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getAccessToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((err: ApiError) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }

      const code = err.code;

      // TOKEN_EXPIRED hoặc UNAUTHORIZED (có refreshToken): thử refresh, retry; không được thì redirect
      if (
        (code === 'TOKEN_EXPIRED' || code === 'UNAUTHORIZED') &&
        auth.getRefreshToken()
      ) {
        return auth.refreshToken().pipe(
          switchMap((res) => {
            if (!res) {
              auth.clearTokens();
              router.navigate(['/admin/login']);
              return throwError(() => err);
            }
            const newReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` },
            });
            return next(newReq);
          }),
          catchError(() => {
            auth.clearTokens();
            router.navigate(['/admin/login']);
            return throwError(() => err);
          })
        );
      }

      if (code === 'INVALID_TOKEN' || code === 'UNAUTHORIZED') {
        auth.clearTokens();
        router.navigate(['/admin/login']);
      }

      return throwError(() => err);
    })
  );
};
