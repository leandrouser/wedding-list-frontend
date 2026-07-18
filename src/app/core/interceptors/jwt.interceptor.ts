import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const token = localStorage.getItem('jwt_token')?.trim();
  const userId = localStorage.getItem('user_id')?.trim();
  const giftListId = localStorage.getItem('gift_list_id')?.trim();

  const isPublic = req.url.includes('/auth/login') ||
                   req.url.includes('/gift-lists/public') ||
                   req.url.includes('/status') ||
                   req.url.includes('cloudinary.com');

  let clonedReq = req;

  if (!isPublic && token) {
    const headers: { [key: string]: string } = {
      'Authorization': `Bearer ${token}`
    };

    if (userId) {
      headers['X-User-Id'] = userId;
    }
    if (giftListId) {
      headers['X-Gift-List-Id'] = giftListId;
    }

    clonedReq = req.clone({
      setHeaders: headers
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isPublic && (error.status === 401 || error.status === 403)) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('gift_list_id');
        router.navigate(['/admin/login']);
      }
      return throwError(() => error);
    })
  );
};
