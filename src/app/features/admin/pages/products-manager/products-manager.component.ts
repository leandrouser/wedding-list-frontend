import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GiftList, GiftListService } from '../../../../core/services/gift-list.service';
import { GiftItem, ProductService } from '../../../../core/services/product.service';
import { PhotoEditorComponent } from "../../../../shared/components/photo-editor/photo-editor.component";
import { PurchaseService, Purchase } from '../../../../core/services/purchase.service';

@Component({
  selector: 'app-gift-list-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PhotoEditorComponent],
  templateUrl: './products-manager.component.html',
  styleUrl: './products-manager.component.css'
})
export class ProductsManagerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly giftListService = inject(GiftListService);
  private readonly productService = inject(ProductService);

  private readonly purchaseService = inject(PurchaseService);

  protected showPurchasesModal = signal(false);
  protected purchasesForProduct = signal<Purchase[]>([]);
  protected isLoadingPurchases = signal(false);
  protected cancellingPurchaseId = signal<number | null>(null);
  protected purchasesModalError = signal<string | null>(null);

  protected list = signal<GiftList | null>(null);
  protected products = signal<GiftItem[]>([]);
  protected isLoading = signal(true);
  protected isLoadingProducts = signal(true);
  protected errorMessage = signal<string | null>(null);
  protected successMessage = signal<string | null>(null);

  protected showPhotoEditor = signal(false);
  protected rawFileForEdit = signal<File | null>(null);

  protected showProductForm = signal(false);
  protected isSavingProduct = signal(false);
  protected editingProductId = signal<number | null>(null);
  protected productPhotoFile = signal<File | null>(null);
  protected productPhotoPreview = signal<string | null>(null);
  protected isUploadingPhoto = signal(false);

  protected productForm: GiftItem = {
    name: '',
    price: 0,
    quantity: 1,
    description: '',
    photoUrl: ''
  };

  protected showDeleteConfirm = signal(false);
  protected productToDelete = signal<GiftItem | null>(null);
  protected isDeleting = signal(false);

  protected showDetailModal = signal(false);
  protected selectedProduct = signal<GiftItem | null>(null);

  protected activeFilter = signal<'all' | 'available' | 'reserved'>('all');

  protected get listId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  protected get filteredProducts(): GiftItem[] {
    const all = this.products();
    switch (this.activeFilter()) {
      case 'available':
        return all.filter(p => (p.availableQuantity ?? 0) > 0);
      case 'reserved':
        return all.filter(p => (p.availableQuantity ?? 0) === 0);
      default:
        return all;
    }
  }

   protected showPhotoLightbox = signal(false);
    protected lightboxPhotoUrl = signal<string | null>(null);
    protected lightboxPhotoAlt = signal<string>('');

  ngOnInit(): void {
    this.loadList();
    this.loadProducts();
  }

  loadList(): void {
    this.giftListService.getGiftListById(this.listId).subscribe({
      next: list => this.list.set(list),
      error: () => this.errorMessage.set('Não foi possível carregar a lista.')
    });
  }

  loadProducts(): void {
    this.isLoadingProducts.set(true);
    this.productService.getProductsByGiftList(this.listId).subscribe({
      next: products => {
        this.products.set(products);
        this.isLoadingProducts.set(false);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível carregar os produtos.');
        this.isLoadingProducts.set(false);
        this.isLoading.set(false);
      }
    });
  }

  openProductForm(): void {
    this.editingProductId.set(null);
    this.productPhotoFile.set(null);
    this.productPhotoPreview.set(null);
    this.productForm = { name: '', price: 0, quantity: 1, description: '', photoUrl: '' };
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.showProductForm.set(true);
  }

  openEditProduct(product: GiftItem): void {
    this.editingProductId.set(product.id ?? null);
    this.productPhotoFile.set(null);
    this.productPhotoPreview.set(product.photoUrl ?? null);
    this.productForm = { ...product };
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.showProductForm.set(true);
  }

  closeProductForm(): void {
    this.showProductForm.set(false);
    this.editingProductId.set(null);
    this.productPhotoFile.set(null);
    this.productPhotoPreview.set(null);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.rawFileForEdit.set(file);
    this.showPhotoEditor.set(true);
    input.value = '';
  }

  onPhotoEditConfirmed(blob: Blob): void {
    const file = new File([blob], `produto-${Date.now()}.jpg`, { type: 'image/jpeg' });
    this.productPhotoFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.productPhotoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
    this.showPhotoEditor.set(false);
    this.rawFileForEdit.set(null);
  }

  onPhotoEditCancelled(): void {
    this.showPhotoEditor.set(false);
    this.rawFileForEdit.set(null);
  }

  removePhoto(): void {
    this.productPhotoFile.set(null);
    this.productPhotoPreview.set(null);
    this.productForm = { ...this.productForm, photoUrl: '' };
  }

  saveProduct(): void {
    if (!this.productForm.name || !this.productForm.price || !this.productForm.quantity) {
      this.errorMessage.set('Preencha nome, preço e quantidade.');
      return;
    }

    this.isSavingProduct.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const id = this.editingProductId();
    const file = this.productPhotoFile();

    const persist = (photoUrl?: string) => {
      const payload: GiftItem = { ...this.productForm };
      if (photoUrl) payload.photoUrl = photoUrl;

      const request$ = id
        ? this.productService.updateProduct(id, payload)
        : this.productService.createProduct(this.listId, payload);

      request$.subscribe({
        next: () => {
          this.isSavingProduct.set(false);
          this.closeProductForm();
          this.successMessage.set(id ? 'Produto atualizado.' : 'Produto adicionado.');
          this.loadProducts();
        },
        error: () => {
          this.isSavingProduct.set(false);
          this.errorMessage.set('Não foi possível salvar o produto.');
        }
      });
    };

    if (file) {
      this.isUploadingPhoto.set(true);
      this.productService.uploadToCloudinary(file).subscribe({
        next: url => {
          this.isUploadingPhoto.set(false);
          persist(url);
        },
        error: () => {
          this.isUploadingPhoto.set(false);
          this.isSavingProduct.set(false);
          this.errorMessage.set('Erro ao fazer upload da foto.');
        }
      });
    } else {
      persist();
    }
  }

  confirmDeleteProduct(product: GiftItem): void {
    this.productToDelete.set(product);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.productToDelete.set(null);
  }

  deleteProduct(): void {
    const product = this.productToDelete();
    if (!product?.id) return;

    this.isDeleting.set(true);
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.cancelDelete();
        this.successMessage.set('Produto excluído.');
        this.loadProducts();
      },
      error: () => {
        this.isDeleting.set(false);
        this.errorMessage.set('Não foi possível excluir o produto.');
      }
    });
  }

  openDetail(product: GiftItem): void {
    this.selectedProduct.set(product);
    this.showDetailModal.set(true);
  }

  openPhotoLightbox(product: GiftItem, event: Event): void {
    event.stopPropagation();
    if (!product.photoUrl) return;
    this.lightboxPhotoUrl.set(product.photoUrl);
    this.lightboxPhotoAlt.set(product.name);
    this.showPhotoLightbox.set(true);
  }

  closePhotoLightbox(): void {
    this.showPhotoLightbox.set(false);
    this.lightboxPhotoUrl.set(null);
  }

  closeDetail(): void {
    this.showDetailModal.set(false);
    this.selectedProduct.set(null);
  }

  setFilter(filter: 'all' | 'available' | 'reserved'): void {
    this.activeFilter.set(filter);
  }

  statusLabel(product: GiftItem): string {
    const avail = product.availableQuantity ?? product.quantity;
    if (avail === 0) return 'Reservado';
    if (avail < product.quantity) return 'Parcial';
    return 'Disponível';
  }

  statusClass(product: GiftItem): string {
    const avail = product.availableQuantity ?? product.quantity;
    if (avail === 0) return 'status-reserved';
    if (avail < product.quantity) return 'status-partial';
    return 'status-available';
  }

  openPurchasesModal(product: GiftItem): void {
    if (!product.id) return;
    this.selectedProduct.set(product);
    this.showPurchasesModal.set(true);
    this.purchasesModalError.set(null);
    this.loadPurchasesForProduct(product.id);
  }

  closePurchasesModal(): void {
    this.showPurchasesModal.set(false);
    this.purchasesForProduct.set([]);
    this.purchasesModalError.set(null);
  }

  private loadPurchasesForProduct(productId: number): void {
    this.isLoadingPurchases.set(true);
    this.purchaseService.getPurchasesByProduct(productId).subscribe({
      next: purchases => {
        this.purchasesForProduct.set(purchases.filter(p => p.status !== 'CANCELLED'));
        this.isLoadingPurchases.set(false);
      },
      error: () => {
        this.purchasesModalError.set('Não foi possível carregar as reservas deste produto.');
        this.isLoadingPurchases.set(false);
      }
    });
  }

  cancelReservation(purchase: Purchase): void {
    if (!purchase.id) return;
    this.cancellingPurchaseId.set(purchase.id);
    this.purchaseService.cancelPurchase(purchase.id).subscribe({
      next: () => {
        this.cancellingPurchaseId.set(null);
        this.successMessage.set('Reserva liberada. Produto disponível novamente.');
        this.loadProducts();
        const productId = this.selectedProduct()?.id;
        if (productId) this.loadPurchasesForProduct(productId);
      },
      error: (err) => {
        this.cancellingPurchaseId.set(null);
        const msg = err?.error?.message || 'Não foi possível liberar essa reserva.';
        this.purchasesModalError.set(msg);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

    selectAllOnFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }
}
