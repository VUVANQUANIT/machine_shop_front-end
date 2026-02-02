import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import type { ApiError } from '../models';

/** Emits ApiError shape for 4xx/5xx so consumers can read code/message/validationErrors. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const body = err.error;
      const apiError: ApiError = {
        timestamp: body?.timestamp ?? '',
        status: err.status,
        error: body?.error ?? err.statusText,
        code: body?.code,
        message: body?.message ?? err.message,
        path: body?.path ?? req.url,
        validationErrors: body?.validationErrors,
      };
      return throwError(() => apiError);
    })
  );
};
