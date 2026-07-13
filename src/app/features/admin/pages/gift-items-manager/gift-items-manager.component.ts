import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, GiftItem } from '../../../../core/services/product.service';
import { GiftListService } from '../../../../core/services/gift-list.service';

@Component({
  selector: 'app-gift-items-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gift-items-manager.component.html',
  styleUrls: ['./gift-items-manager.component.css']
})
export class GiftItemsManagerComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly giftListService = inject(GiftListService);
  private readonly router = inject(Router);

  protected items = signal<GiftItem[]>([]);
  protected isLoading = signal(true);
  protected listId: number | null = null;

  // Delete modal
  protected itemToDelete = signal<GiftItem | null>(null);
  protected isDeleting = signal(false);
  protected deleteError = signal<string | null>(null);

  // Create/Edit modal
  protected showItemForm = signal(false);
  protected editingItem = signal<GiftItem | null>(null);
  protected isSavingItem = signal(false);
  protected itemFormError = signal<string | null>(null);

  protected itemForm = {
    name: '',
    price: 0,
    quantity: 1,
    description: ''
  };

  // Photo upload
  protected selectedFile = signal<File | null>(null);
  protected previewUrl = signal<string | null>(null);
  protected isUploadingPhoto = signal(false);

  ngOnInit(): void {
    this.giftListService.getAllPublicLists().subscribe({
      next: (lists) => {
        if (lists && lists.length > 0) {
          this.listId = lists[0].id!;
          this.loadItems();
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadItems(): void {
    if (!this.listId) return;
    this.isLoading.set(true);
    this.productService.getProductsByGiftList(this.listId).subscribe({
      next: (data) => {
        this.items.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // ── Item form ──────────────────────────────────────────────

  openAddModal(): void {
    this.editingItem.set(null);
    this.itemForm = { name: '', price: 0, quantity: 1, description: '' };
    this.clearPhoto();
    this.itemFormError.set(null);
    this.showItemForm.set(true);
  }

  openEditModal(item: GiftItem): void {
    this.editingItem.set(item);
    this.itemForm = {
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      description: item.description ?? ''
    };
    this.selectedFile.set(null);
    this.previewUrl.set(item.photoUrl ?? null);
    this.itemFormError.set(null);
    this.showItemForm.set(true);
  }

  closeItemForm(): void {
    this.showItemForm.set(false);
    this.editingItem.set(null);
    this.clearPhoto();
    this.itemFormError.set(null);
  }

  saveItem(): void {
    if (!this.itemForm.name || !this.itemForm.price || !this.listId) {
      this.itemFormError.set('Preencha nome e preço do presente.');
      return;
    }

    this.isSavingItem.set(true);
    this.itemFormError.set(null);

    const editing = this.editingItem();
    const file = this.selectedFile();

    const doSave = (photoUrl?: string) => {
      const payload: GiftItem = {
        name: this.itemForm.name,
        price: this.itemForm.price,
        quantity: this.itemForm.quantity,
        description: this.itemForm.description,
        giftListId: this.listId!,
        photoUrl: photoUrl ?? (editing?.photoUrl ?? undefined)
      };

      const request$ = editing?.id
        ? this.productService.updateProduct(editing.id, payload)
        : this.productService.createProduct(this.listId!, payload);

      request$.subscribe({
        next: () => {
          this.isSavingItem.set(false);
          this.closeItemForm();
          this.loadItems();
        },
        error: () => {
          this.isSavingItem.set(false);
          this.itemFormError.set('Não foi possível salvar o presente.');
        }
      });
    };

    if (file) {
      this.isUploadingPhoto.set(true);
      this.productService.uploadToCloudinary(file).subscribe({
        next: (url) => {
          this.isUploadingPhoto.set(false);
          doSave(url);
        },
        error: () => {
          this.isUploadingPhoto.set(false);
          this.isSavingItem.set(false);
          this.itemFormError.set('Não foi possível fazer o upload da foto.');
        }
      });
    } else {
      doSave();
    }
  }

  // ── Photo handling ─────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.setPhoto(input.files[0]);
    }
  }

  triggerGallery(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => this.onFileSelected(e);
    input.click();
  }

  triggerCamera(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => this.onFileSelected(e);
    input.click();
  }

  private setPhoto(file: File): void {
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  clearPhoto(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  // ── Delete modal ───────────────────────────────────────────

  openDeleteModal(item: GiftItem): void {
    this.itemToDelete.set(item);
    this.deleteError.set(null);
  }

  closeDeleteModal(): void {
    this.itemToDelete.set(null);
    this.deleteError.set(null);
  }

  confirmDelete(): void {
    const item = this.itemToDelete();
    if (!item?.id) return;

    this.isDeleting.set(true);
    this.deleteError.set(null);

    this.productService.deleteProduct(item.id).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i.id !== item.id));
        this.isDeleting.set(false);
        this.closeDeleteModal();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.deleteError.set(
          err?.error?.message || 'Não foi possível excluir. O produto pode ter compras associadas.'
        );
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────

  getStatusLabel(item: GiftItem): string {
    const status = (item as any).status;
    if (status === 'PURCHASED') return 'Comprado';
    if (status === 'PARTIALLY_PURCHASED') return 'Parcial';
    return 'Disponível';
  }

  getStatusClass(item: GiftItem): string {
    const status = (item as any).status;
    if (status === 'PURCHASED') return 'status-purchased';
    if (status === 'PARTIALLY_PURCHASED') return 'status-partial';
    return 'status-available';
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}