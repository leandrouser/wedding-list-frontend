import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { coupleGuard } from './core/guards/couple.guard';

export const routes: Routes = [
  // Acesso dos convidados
  {
    path: 'public',
    loadComponent: () => import('./features/public/pages/gift-lists/public-gift-lists.component')
      .then(c => c.PublicGiftListsComponent)
  },
  {
    path: 'lista/:id',
    loadComponent: () => import('./features/public/pages/gift-items/public-gift-items.component')
      .then(c => c.PublicGiftItemsComponent)
  },
  {
    path: 'produto/:id',
    loadComponent: () => import('./features/public/pages/product-detail/public-product-detail.component')
      .then(c => c.PublicProductDetailComponent)
  },
  {
    path: 'pagamento',
    loadComponent: () => import('./features/public/pages/payment/payment.component')
      .then(c => c.PaymentComponent)
  },
  {
    path: 'pagamento/sucesso',
    loadComponent: () => import('./features/public/pages/payment-success/payment-success.component')
      .then(c => c.PaymentSuccessComponent)
  },
  {
    path: 'pagamento/falha',
    loadComponent: () => import('./features/public/pages/payment-failure/payment-failure.component')
      .then(c => c.PaymentFailureComponent)
  },

  // Login compartilhado por casal e administrador
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/pages/login/login.component')
      .then(c => c.LoginComponent)
  },

  // Acesso do casal
  {
    path: 'admin',
    canActivate: [coupleGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/couple/dashboard/couple-dashboard.component')
          .then(c => c.CoupleDashboardComponent)
      },
      { path: 'minha-lista', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'presentes',
        loadComponent: () => import('./features/couple/gift-items-manager/couple-gifts.component')
          .then(c => c.CoupleGiftsComponent)
      },
      {
        path: 'presentes/novo',
        loadComponent: () => import('./features/couple/gift-item-form/gift-item-form.component')
          .then(c => c.GiftItemFormComponent)
      },
      {
        path: 'presentes/editar',
        loadComponent: () => import('./features/couple/gift-item-form/gift-item-form.component')
          .then(c => c.GiftItemFormComponent)
      },
      {
        path: 'compras',
        loadComponent: () => import('./features/couple/purchases-tracker/purchases-tracker.component')
          .then(c => c.PurchasesTrackerComponent)
      }
    ]
  },

  // Acesso do administrador - SEM SIDEBAR / SHELL
  {
    path: 'superadmin',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/pages/admin-dashboard/admin-main-dashboard.component')
          .then(c => c.AdminMainDashboardComponent)
      },
       {
        path: 'lista/:id',
        loadComponent: () => import('./features/admin/pages/products-manager/products-manager.component')
          .then(c => c.ProductsManagerComponent)
      },
      {
        path: 'noivos',
        loadComponent: () => import('./features/admin/pages/couples-manager/couples-manager.component')
          .then(c => c.CouplesManagerComponent)
      },
      {
        path: 'listas',
        loadComponent: () => import('./features/admin/pages/lists-manager/lists-manager.component')
          .then(c => c.ListsManagerComponent)
      },
      {
        path: 'produtos',
        loadComponent: () => import('./features/admin/pages/products-manager/products-manager.component')
          .then(c => c.ProductsManagerComponent)
      },
      {
        path: 'compras',
        loadComponent: () => import('./features/admin/pages/purchases-manager/purchases-manager.component')
          .then(c => c.PurchasesManagerComponent)
      },
      {
        path: 'presentes',
        loadComponent: () => import('./features/admin/pages/gift-items-manager/gift-items-manager.component')
          .then(c => c.GiftItemsManagerComponent)
      },
    ]
  },

  {
    path: '**',
    redirectTo: 'public'
  }
];