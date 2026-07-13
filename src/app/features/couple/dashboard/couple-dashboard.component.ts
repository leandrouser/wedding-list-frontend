import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GiftList, GiftListService } from '../../../core/services/gift-list.service';
import { ProductService, GiftItem } from '../../../core/services/product.service';

@Component({
  selector: 'app-couple-gifts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './couple-dashboard.component.html',
  styleUrls: ['./couple-dashboard.component.css']
})
export class CoupleDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly giftListService = inject(GiftListService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  protected list = signal<GiftList | null>(null);
  protected items = signal<GiftItem[]>([]);
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);
  protected successMessage = signal<string | null>(null);

  protected showEditForm = signal(false);
  protected isSavingEdit = signal(false);
  protected editForm = { coupleName: '', coupleWhatsapp: '' };
  protected editPhotoFile = signal<File | null>(null);
  protected editPhotoPreview = signal<string | null>(null);

  protected purchasedCount = computed(() =>
    this.items().filter(i => i.isPurchased).length
  );

  protected availableCount = computed(() =>
    this.items().filter(i => !i.isPurchased).length
  );

  readonly listTitleMap: Record<string, string> = {
    LISTA_DE_CASAMENTO: 'Lista de Casamento',
    LISTA_DE_PRESENTE: 'Lista de Presente',
    LISTA_DE_CASA_NOVA: 'Lista de Casa Nova',
    LISTA_DE_15_ANOS: 'Lista de 15 Anos',
  };

  formatTitle(value: string): string {
    return this.listTitleMap[value] ?? value;
  }

  ngOnInit(): void {
    const giftListId = Number(this.authService.currentGiftListId); 
     console.log('gift_list_id no localStorage:', localStorage.getItem('gift_list_id'));
      console.log('giftListId resolvido:', giftListId);
    if (!giftListId || isNaN(giftListId)) {
      this.isLoading.set(false);
      this.errorMessage.set('Seu acesso ainda não está vinculado a uma lista. Fale com o administrador.');
      return;
    }

    this.giftListService.getGiftListById(giftListId).subscribe({
      next: list => {
        this.list.set(list);
        this.loadItems(giftListId);
      },
      error: () => {
        this.errorMessage.set('Não foi possível carregar a lista.');
        this.isLoading.set(false);
      }
    });
  }

  private loadItems(listId: number): void {
    this.productService.getProductsByGiftList(listId).subscribe({
      next: items => {
        this.items.set(items);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openEditForm(): void {
    const list = this.list();
    if (!list) return;
    this.editForm = {
      coupleName: list.coupleName,
      coupleWhatsapp: list.coupleWhatsapp ?? ''
    };
    this.editPhotoFile.set(null);
    this.editPhotoPreview.set(list.photoUrl ?? null);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.showEditForm.set(true);
  }

  closeEditForm(): void {
    this.showEditForm.set(false);
    this.editPhotoFile.set(null);
    this.editPhotoPreview.set(null);
  }

  saveEdit(): void {
    const list = this.list();
    if (!list?.id) return;

    this.isSavingEdit.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: Partial<GiftList> = {
      giftTitle: list.giftTitle,
      eventDate: list.eventDate,
      coupleName: this.editForm.coupleName,
      coupleWhatsapp: this.editForm.coupleWhatsapp
    };

    this.giftListService.updateGiftList(list.id, payload, this.editPhotoFile() ?? undefined).subscribe({
      next: updated => {
        this.list.set(updated);
        this.isSavingEdit.set(false);
        this.closeEditForm();
        this.successMessage.set('Dados atualizados com sucesso.');
      },
      error: () => {
        this.isSavingEdit.set(false);
        this.errorMessage.set('Não foi possível atualizar os dados.');
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.applyPhoto(file);
  }

  onCameraCapture(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.applyPhoto(file);
  }

  private applyPhoto(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => this.editPhotoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
    this.editPhotoFile.set(file);
  }

  removePhoto(): void {
    this.editPhotoFile.set(null);
    this.editPhotoPreview.set(null);
  }

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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login'], { replaceUrl: true });
  }


}