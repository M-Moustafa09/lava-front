import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const adminOnlyGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.user()) {
    try {
      await authService.fetchUser();
    } catch { }
  }

  if (authService.user()?.role === 'admin') {
    return true;
  }

  return router.createUrlTree(['/404']);
};

