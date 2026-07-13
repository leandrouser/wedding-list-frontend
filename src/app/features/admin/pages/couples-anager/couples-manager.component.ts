import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { GiftList, GiftListService } from '../../../../core/services/gift-list.service';
import { CoupleDTO } from '../../../../core/services/user.service';

@Component({
  selector: 'app-couples-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './couples-manager.component.html',
  styleUrls: ['./couples-manager.component.css']
})
export class CouplesManagerComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly giftListService = inject(GiftListService);
  private readonly location = inject(Location);

  protected couples = signal<CoupleDTO[]>([]);
  protected lists = signal<GiftList[]>([]);
  protected isLoading = signal(true);
  protected successMessage = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);

  // Modal editar
  protected showEditModal = signal(false);
  protected isSavingEdit = signal(false);
  protected editingCouple = signal<CoupleDTO | null>(null);
  protected editForm = { phoneNumber: '', password: '' };

  // Modal vincular lista
  protected showLinkModal = signal(false);
  protected isLinking = signal(false);
  protected linkingCouple = signal<CoupleDTO | null>(null);
  protected selectedListId = signal<number | null>(null);

  // Modal confirmar exclusão
  protected showDeleteModal = signal(false);
  protected isDeleting = signal(false);
  protected coupleToDelete = signal<CoupleDTO | null>(null);

  // Modal confirmar desvincular
  protected showUnlinkModal = signal(false);
  protected isUnlinking = signal(false);
  protected coupleToUnlink = signal<CoupleDTO | null>(null);

  ngOnInit(): void {
    this.loadCouples();
    this.loadLists();
  }

  loadCouples(): void {
    this.isLoading.set(true);
    this.userService.getAllCouples().subscribe({
      next: couples => {
        this.couples.set(couples);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível carregar os casais.');
        this.isLoading.set(false);
      }
    });
  }

  loadLists(): void {
    this.giftListService.getAllLists().subscribe({
      next: lists => this.lists.set(lists),
      error: () => {}
    });
  }

  listNameById(id: number | null): string {
    if (!id) return '—';
    const list = this.lists().find(l => l.id === id);
    return list ? list.coupleName : `Lista #${id}`;
  }

  goBack(): void {
    this.location.back();
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  // EDITAR
  openEditModal(couple: CoupleDTO): void {
    this.editingCouple.set(couple);
    this.editForm = { phoneNumber: couple.phoneNumber ?? '', password: '' };
    this.clearMessages();
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingCouple.set(null);
  }

  saveEdit(): void {
    const couple = this.editingCouple();
    if (!couple) return;
    this.isSavingEdit.set(true);
    this.clearMessages();
    this.userService.updateCouple(couple.id, {
      phoneNumber: this.editForm.phoneNumber || undefined,
      password: this.editForm.password || undefined
    }).subscribe({
      next: () => {
        this.isSavingEdit.set(false);
        this.closeEditModal();
        this.successMessage.set('Dados atualizados com sucesso.');
        this.loadCouples();
      },
      error: () => {
        this.isSavingEdit.set(false);
        this.errorMessage.set('Não foi possível atualizar os dados.');
      }
    });
  }

  // VINCULAR LISTA
  openLinkModal(couple: CoupleDTO): void {
    this.linkingCouple.set(couple);
    this.selectedListId.set(couple.giftListId ?? null);
    this.clearMessages();
    this.showLinkModal.set(true);
  }

  closeLinkModal(): void {
    this.showLinkModal.set(false);
    this.linkingCouple.set(null);
    this.selectedListId.set(null);
  }

  saveLink(): void {
    const couple = this.linkingCouple();
    const listId = this.selectedListId();
    if (!couple || !listId) return;
    this.isLinking.set(true);
    this.clearMessages();
    this.userService.linkCoupleToList(couple.id, listId).subscribe({
      next: () => {
        this.isLinking.set(false);
        this.closeLinkModal();
        this.successMessage.set('Lista vinculada com sucesso.');
        this.loadCouples();
      },
      error: () => {
        this.isLinking.set(false);
        this.errorMessage.set('Não foi possível vincular a lista.');
      }
    });
  }

  // DESVINCULAR
  openUnlinkModal(couple: CoupleDTO): void {
    this.coupleToUnlink.set(couple);
    this.clearMessages();
    this.showUnlinkModal.set(true);
  }

  closeUnlinkModal(): void {
    this.showUnlinkModal.set(false);
    this.coupleToUnlink.set(null);
  }

  confirmUnlink(): void {
    const couple = this.coupleToUnlink();
    if (!couple) return;
    this.isUnlinking.set(true);
    this.clearMessages();
    this.userService.unlinkCoupleFromList(couple.id).subscribe({
      next: () => {
        this.isUnlinking.set(false);
        this.closeUnlinkModal();
        this.successMessage.set('Lista desvinculada com sucesso.');
        this.loadCouples();
      },
      error: () => {
        this.isUnlinking.set(false);
        this.errorMessage.set('Não foi possível desvincular a lista.');
      }
    });
  }

  // EXCLUIR
  openDeleteModal(couple: CoupleDTO): void {
    this.coupleToDelete.set(couple);
    this.clearMessages();
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.coupleToDelete.set(null);
  }

  confirmDelete(): void {
    const couple = this.coupleToDelete();
    if (!couple) return;
    this.isDeleting.set(true);
    this.clearMessages();
    this.userService.deleteCouple(couple.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.successMessage.set('Acesso removido com sucesso.');
        this.loadCouples();
      },
      error: () => {
        this.isDeleting.set(false);
        this.errorMessage.set('Não foi possível remover o acesso.');
      }
    });
  }
}