import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt_token')?.trim();
  console.log('Interceptor acionado:', req.url, 'token:', !!token);
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

  return next(clonedReq);
};
