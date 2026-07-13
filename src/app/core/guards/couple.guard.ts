import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const coupleGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('jwt_token');
  const role = localStorage.getItem('role');

  if (token && token.trim().length > 0 && role === 'COUPLE') {
    return true;
  }

  if (token && token.trim().length > 0 && role === 'ADMIN') {
    router.navigate(['/superadmin/dashboard']);
    return false;
  }

  router.navigate(['/admin/login']);
  return false;
};
