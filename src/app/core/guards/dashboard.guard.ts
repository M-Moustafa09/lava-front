import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { environment } from '../../../environments/environment';

export const dashboardGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[dashboardGuard] executing for', state.url);

  authService.user.set({
    id: 'dev-admin',
    name: 'LAVVA Admin',
    email: 'admin@lavva.com',
    role: 'admin'
  });

  return true;
};

