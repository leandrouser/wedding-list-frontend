import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PurchaseService, Purchase, PurchasesSummary } from '../../../core/services/purchase.service';
import { AuthService } from '../../../core/services/auth.service';

type FilterType = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';

@Component({
  selector: 'app-purchases-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchases-tracker.component.html',
  styleUrls: ['./purchases-tracker.component.css']
})
export class PurchasesTrackerComponent implements OnInit {
  private readonly purchaseService = inject(PurchaseService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected purchases = signal<Purchase[]>([]);
  protected summary = signal<PurchasesSummary | null>(null);
  protected isLoading = signal(true);
  protected listId: number | null = null;

  protected activeFilter = signal<FilterType>('ALL');
  protected purchaseToDelete = signal<Purchase | null>(null);
  protected isDeleting = signal(false);
  protected actionError = signal<string | null>(null);

  protected filteredPurchases = computed(() => {
    const f = this.activeFilter();
    const all = this.purchases();
    if (f === 'ALL') return all;
    return all.filter(p => p.status === f);
  });

  ngOnInit(): void {
    this.listId = this.authService.currentGiftListId;
    if (!this.listId) {
      this.isLoading.set(false);
      return;
    }
    this.loadData();
  }

  loadData(): void {
    if (!this.listId) return;
    this.isLoading.set(true);

    this.purchaseService.getSummaryByGiftList(this.listId).subscribe({
      next: s => this.summary.set(s),
      error: () => {}
    });

    this.purchaseService.getPurchasesByGiftList(this.listId).subscribe({
      next: (data) => {
        this.purchases.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  setFilter(f: FilterType): void {
    this.activeFilter.set(f);
  }

  loadPurchases(): void {
    if (!this.listId) return;

    this.isLoading.set(true);
    this.purchaseService.getPurchasesByGiftList(this.listId).subscribe({
      next: (data) => {
        this.purchases.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao buscar compras', err);
        this.isLoading.set(false);
      }
    });
  }

  confirmPurchase(purchase: Purchase): void {
    if (!purchase.id) return;
    this.purchaseService.confirmPurchaseManually(purchase.id).subscribe({
      next: () => this.loadData(),
      error: () => alert('Erro ao confirmar a compra.')
    });
  }

  cancelPurchase(purchase: Purchase): void {
    if (!purchase.id) return;
    this.purchaseService.cancelPurchase(purchase.id).subscribe({
      next: () => this.loadData(),
      error: () => alert('Erro ao cancelar a compra.')
    });
  }

  openDeleteModal(purchase: Purchase): void {
    this.purchaseToDelete.set(purchase);
    this.actionError.set(null);
  }

  closeDeleteModal(): void {
    this.purchaseToDelete.set(null);
    this.actionError.set(null);
  }

  confirmDelete(): void {
    const p = this.purchaseToDelete();
    if (!p?.id) return;

    this.isDeleting.set(true);
    this.purchaseService.deletePurchasePermanent(p.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.loadData();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.actionError.set(err?.error?.message || 'Erro ao excluir a compra.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
