import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: '',
    loadChildren: () => import('./storefront/storefront.routes').then(m => m.STOREFRONT_ROUTES)
  },
  {
    path: '**',
    redirectTo: '404',
    pathMatch: 'full'
  }
];

