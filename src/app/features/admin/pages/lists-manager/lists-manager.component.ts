import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GiftList, GiftListService } from '../../../../core/services/gift-list.service';

@Component({
  selector: 'app-lists-manager',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './lists-manager.component.html',
  styleUrls: ['./lists-manager.component.css']
})
export class ListsManagerComponent implements OnInit {
  private readonly giftListService = inject(GiftListService);
  private readonly router = inject(Router);

  protected lists = signal<GiftList[]>([]);
  protected isLoading = signal(true);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected successMessage = signal<string | null>(null);

  // Create modal
  protected showCreateForm = signal(false);
  protected createForm = this.emptyForm();

  // Edit modal
  protected showEditForm = signal(false);
  protected editingList = signal<GiftList | null>(null);
  protected editForm = this.emptyForm();

  // Delete modal
  protected listToDelete = signal<GiftList | null>(null);
  protected isDeleting = signal(false);
  protected deleteError = signal<string | null>(null);

  // Photo — create
  protected createPhotoFile = signal<File | null>(null);
  protected createPreviewUrl = signal<string | null>(null);

  // Photo — edit
  protected editPhotoFile = signal<File | null>(null);
  protected editPreviewUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  logoutCurrentSession(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/admin/login']);
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.giftListService.getAllLists().subscribe({
      next: lists => { this.lists.set(lists); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('Não foi possível carregar as listas.'); this.isLoading.set(false); }
    });
  }

  // ── Create ─────────────────────────────────────────────────

  openCreateForm(): void {
    this.createForm = this.emptyForm();
    this.createPhotoFile.set(null);
    this.createPreviewUrl.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showCreateForm.set(true);
  }

  closeCreateForm(): void {
    this.showCreateForm.set(false);
  }

  saveCreate(): void {
    if (!this.createForm.giftTitle || !this.createForm.coupleName || !this.createForm.eventDate) {
      this.errorMessage.set('Preencha título, nomes dos noivos e data do evento.');
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.giftListService.createGiftList(this.createForm, this.createPhotoFile() ?? undefined).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeCreateForm();
        this.successMessage.set('Lista criada com sucesso.');
        this.load();
      },
      error: () => { this.isSaving.set(false); this.errorMessage.set('Não foi possível criar a lista.'); }
    });
  }

  // ── Edit ───────────────────────────────────────────────────

  openEditForm(list: GiftList): void {
    this.editingList.set(list);
    this.editForm = {
      giftTitle: list.giftTitle,
      coupleName: list.coupleName,
      eventDate: list.eventDate,
      coupleWhatsapp: list.coupleWhatsapp ?? '',
      storePix: list.storePix ?? ''
    };
    this.editPhotoFile.set(null);
    this.editPreviewUrl.set(list.photoUrl ?? null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showEditForm.set(true);
  }

  closeEditForm(): void {
    this.showEditForm.set(false);
    this.editingList.set(null);
  }

  saveEdit(): void {
    const list = this.editingList();
    if (!list?.id) return;
    if (!this.editForm.giftTitle || !this.editForm.coupleName || !this.editForm.eventDate) {
      this.errorMessage.set('Preencha título, nomes dos noivos e data do evento.');
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.giftListService.updateGiftList(list.id, this.editForm, this.editPhotoFile() ?? undefined).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeEditForm();
        this.successMessage.set('Lista atualizada com sucesso.');
        this.load();
      },
      error: () => { this.isSaving.set(false); this.errorMessage.set('Não foi possível salvar as alterações.'); }
    });
  }

  // ── Delete ─────────────────────────────────────────────────

  openDeleteModal(list: GiftList): void {
    this.listToDelete.set(list);
    this.deleteError.set(null);
  }

  closeDeleteModal(): void {
    this.listToDelete.set(null);
    this.deleteError.set(null);
  }

  confirmDelete(): void {
    const list = this.listToDelete();
    if (!list?.id) return;
    this.isDeleting.set(true);
    this.giftListService.deleteGiftList(list.id).subscribe({
      next: () => {
        this.lists.update(all => all.filter(l => l.id !== list.id));
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.successMessage.set('Lista excluída.');
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.deleteError.set(err?.error?.message || 'Não foi possível excluir a lista.');
      }
    });
  }

  // ── Photo helpers ──────────────────────────────────────────

  triggerGallery(mode: 'create' | 'edit'): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => this.onFileSelected(e, mode);
    input.click();
  }

  triggerCamera(mode: 'create' | 'edit'): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => this.onFileSelected(e, mode);
    input.click();
  }

  private onFileSelected(event: Event, mode: 'create' | 'edit'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (mode === 'create') { this.createPhotoFile.set(file); this.createPreviewUrl.set(url); }
      else { this.editPhotoFile.set(file); this.editPreviewUrl.set(url); }
    };
    reader.readAsDataURL(file);
  }

  clearPhoto(mode: 'create' | 'edit'): void {
    if (mode === 'create') { this.createPhotoFile.set(null); this.createPreviewUrl.set(null); }
    else { this.editPhotoFile.set(null); this.editPreviewUrl.set(null); }
  }

  // ── Utils ──────────────────────────────────────────────────

  private emptyForm() {
    return { giftTitle: '', coupleName: '', eventDate: '', coupleWhatsapp: '', storePix: '' };
  }
}