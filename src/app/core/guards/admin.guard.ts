import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('jwt_token');
  const role = localStorage.getItem('role');

  if (token && token.trim().length > 0 && role === 'ADMIN') {
    return true;
  }

  if (token && token.trim().length > 0) {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  router.navigate(['/admin/login']);
  return false;
};
