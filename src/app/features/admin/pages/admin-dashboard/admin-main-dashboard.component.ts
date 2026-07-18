import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, CoupleDTO } from '../../../../core/services/user.service';
import { GiftList, GiftListService } from '../../../../core/services/gift-list.service';
import { StoreService } from '../../../../core/services/store.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-admin-main-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ImageCropperComponent],
  templateUrl: './admin-main-dashboard.component.html',
  styleUrls: ['./admin-main-dashboard.component.css']
})
export class AdminMainDashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly giftListService = inject(GiftListService);
  private readonly userService = inject(UserService);
  private readonly location = inject(Location);
  private readonly storeService = inject(StoreService);

  protected username = localStorage.getItem('username') ?? 'Admin';
  protected lists = signal<GiftList[]>([]);
  protected isLoading = signal(true);
  protected isSavingList = signal(false);
  protected isSavingAccess = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected successMessage = signal<string | null>(null);

  protected showListForm = signal(false);
  protected showAccessForm = signal(false);
  protected isDeleting = signal(false);
  protected showDeleteConfirm = signal(false);
  protected listToDelete = signal<GiftList | null>(null);

  protected showLinkForm = signal(false);
  protected listToLink = signal<GiftList | null>(null);
  protected coupleSearch = '';
  protected coupleResults = signal<CoupleDTO[]>([]);
  protected selectedCouple = signal<CoupleDTO | null>(null);
  protected isSearching = signal(false);
  protected isLinking = signal(false);
  protected isEditingLink = signal(false);

  protected showCropper = signal(false);
  protected imageChangedEvent: Event | null = null;
  protected croppedImagePreview = signal<string | null>(null);
  private cropperMode: 'create' | 'edit' = 'create';
  protected croppedBlob = signal<Blob | null>(null);
  protected isCropperLoading = signal(true);

  protected showEditForm = signal(false);
  protected isSavingEdit = signal(false);
  protected editingListId = signal<number | null>(null);

  protected showStoreForm = signal(false);
  protected isSavingStore = signal(false);
  protected storeForm = { name: '', pixKey: '', whatsapp: '' };

  protected listPhotoFile = signal<File | null>(null);
  protected listPhotoPreview = signal<string | null>(null);
  protected editPhotoFile = signal<File | null>(null);
  protected editPhotoPreview = signal<string | null>(null);

  protected listForm = {
    giftTitle: '',
    coupleName: '',
    eventDate: '',
    coupleWhatsapp: '',
    storePix: '',
    message: ''
  };

  protected accessForm = {
    giftListId: null as number | null,
    username: '',
    phoneNumber: '',
    password: ''
  };

  protected editFormData = {
    giftTitle: '',
    coupleName: '',
    eventDate: '',
    coupleWhatsapp: '',
    message: ''
  };

  protected totalProducts = computed(() =>
    this.lists().reduce((total, list) => total + (list.products?.length ?? 0), 0)
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
    this.loadLists();
  }

  loadLists(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.giftListService.getAllLists().subscribe({
      next: lists => {
        this.lists.set(lists);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Nao foi possivel carregar as listas cadastradas.');
        this.isLoading.set(false);
      }
    });
  }

  openStoreForm(): void {
    this.storeService.getMyStore().subscribe({
      next: store => {
        this.storeForm = {
          name: store.name ?? '',
          pixKey: store.pixKey ?? '',
          whatsapp: store.whatsapp ?? ''
        };
      },
      error: () => {
        this.storeForm = { name: '', pixKey: '', whatsapp: '' };
      }
    });
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.showStoreForm.set(true);
  }

  closeStoreForm(): void {
    this.showStoreForm.set(false);
  }

  saveStore(): void {
    this.isSavingStore.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.storeService.saveOrUpdate(this.storeForm).subscribe({
      next: () => {
        this.isSavingStore.set(false);
        this.closeStoreForm();
        this.successMessage.set('Dados da loja salvos com sucesso.');
      },
      error: () => {
        this.isSavingStore.set(false);
        this.errorMessage.set('Não foi possível salvar os dados da loja.');
      }
    });
  }

  openEditForm(list: GiftList): void {
    this.editingListId.set(list.id ?? null);
    this.editFormData = {
      giftTitle: list.giftTitle ?? '',
      coupleName: list.coupleName,
      eventDate: list.eventDate,
      coupleWhatsapp: list.coupleWhatsapp ?? '',
      message: ''
    };
    this.editPhotoFile.set(null);
    this.editPhotoPreview.set(list.photoUrl ?? list.couplePhotoUrl ?? null);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.showEditForm.set(true);
  }

  closeEditForm(): void {
    this.showEditForm.set(false);
    this.editingListId.set(null);
    this.editPhotoFile.set(null);
    this.editPhotoPreview.set(null);
  }

  saveEdit(): void {
    const id = this.editingListId();
    if (!id) return;

    this.isSavingEdit.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.giftListService.updateGiftList(id, this.editFormData, this.editPhotoFile() ?? undefined).subscribe({
      next: () => {
        this.isSavingEdit.set(false);
        this.closeEditForm();
        this.successMessage.set('Lista atualizada com sucesso.');
        this.loadLists();
      },
      error: () => {
        this.isSavingEdit.set(false);
        this.errorMessage.set('Não foi possível atualizar a lista.');
      }
    });
  }

  openListForm(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.showListForm.set(true);
  }

  closeListForm(): void {
    this.showListForm.set(false);
    this.listPhotoFile.set(null);
    this.listPhotoPreview.set(null);
    this.listForm = {
      giftTitle: '',
      coupleName: '',
      eventDate: '',
      coupleWhatsapp: '',
      storePix: '',
      message: ''
    };
  }

  createList(): void {
    if (!this.listForm.giftTitle || !this.listForm.coupleName || !this.listForm.eventDate) {
      this.errorMessage.set('Preencha titulo, nomes dos noivos e data do evento.');
      return;
    }

    this.isSavingList.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.giftListService.createGiftList(this.listForm, this.listPhotoFile() ?? undefined).subscribe({
      next: () => {
        this.isSavingList.set(false);
        this.closeListForm();
        this.successMessage.set('Lista criada com sucesso.');
        this.loadLists();
      },
      error: () => {
        this.isSavingList.set(false);
        this.errorMessage.set('Nao foi possivel criar a lista.');
      }
    });
  }

  openAccessForm(list?: GiftList): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.accessForm = {
      giftListId: list?.id ?? null,
      username: list?.coupleWhatsapp ?? '',
      phoneNumber: list?.coupleWhatsapp ?? '',
      password: ''
    };
    this.showAccessForm.set(true);
  }

  closeAccessForm(): void {
    this.showAccessForm.set(false);
    this.accessForm = {
      giftListId: null,
      username: '',
      phoneNumber: '',
      password: ''
    };
  }

  createCoupleAccess(): void {
    if (!this.accessForm.giftListId || !this.accessForm.username || !this.accessForm.phoneNumber || !this.accessForm.password) {
      this.errorMessage.set('Selecione a lista e preencha usuario, telefone e senha para o casal.');
      return;
    }

    this.isSavingAccess.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.createCoupleAccess({
      username: this.accessForm.username,
      password: this.accessForm.password,
      phoneNumber: this.accessForm.phoneNumber,
      giftListId: this.accessForm.giftListId,
      role: 'COUPLE'
    }).subscribe({
      next: () => {
        this.isSavingAccess.set(false);
        this.closeAccessForm();
        this.successMessage.set('Acesso do casal cadastrado com sucesso.');
      },
      error: () => {
        this.isSavingAccess.set(false);
        this.errorMessage.set('Nao foi possivel cadastrar o acesso do casal.');
      }
    });
  }

   goBack(): void {
     this.location.back();
   }

   confirmDelete(list: GiftList): void {
    this.listToDelete.set(list);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.listToDelete.set(null);
  }

  deleteList(): void {
    const list = this.listToDelete();
    if (!list?.id) return;

    this.isDeleting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.giftListService.deleteGiftList(list.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.cancelDelete();
        this.successMessage.set('Lista excluída com sucesso.');
        this.loadLists();
      },
      error: () => {
        this.isDeleting.set(false);
        this.errorMessage.set('Não foi possível excluir a lista.');
      }
    });
  }

    openLinkForm(list: GiftList): void {
    this.listToLink.set(list);
    this.coupleSearch = '';
    this.coupleResults.set([]);
    this.selectedCouple.set(null);
    this.isEditingLink.set(!!list.hasCouple);
    this.showLinkForm.set(true);
    }

  closeLinkForm(): void {
    this.showLinkForm.set(false);
    this.listToLink.set(null);
  }

  onSearchCouple(): void {
    if (this.coupleSearch.length < 2) {
      this.coupleResults.set([]);
      return;
    }
    this.isSearching.set(true);
    this.userService.searchCouples(this.coupleSearch).subscribe({
      next: results => {
        this.coupleResults.set(results);
        this.isSearching.set(false);
      },
      error: () => this.isSearching.set(false)
    });
  }

  selectCouple(couple: CoupleDTO): void {
    this.selectedCouple.set(couple);
  }

  linkCouple(): void {
    const couple = this.selectedCouple();
    const list = this.listToLink();
    if (!couple || !list?.id) return;

    console.log('linkCouple chamado', { couple, listId: list.id, isEditing: this.isEditingLink() });

    this.isLinking.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.userService.linkCoupleToList(couple.id, list.id).subscribe({
      next: () => {
        this.isLinking.set(false);
        this.closeLinkForm();
        this.successMessage.set(
          this.isEditingLink() ? 'Acesso atualizado com sucesso.' : 'Casal vinculado com sucesso.'
        );
        this.loadLists();
      },
      error: (err) => {
        console.error('Erro ao vincular', err);
        this.isLinking.set(false);
        this.errorMessage.set('Não foi possível vincular o casal.');
      }
    });
  }

  onPhotoSelected(event: Event, mode: 'create' | 'edit'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;
    this.openCropper(event, mode);
  }

  onCameraCapture(event: Event, mode: 'create' | 'edit'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;
    this.openCropper(event, mode);
  }

  private openCropper(event: Event, mode: 'create' | 'edit'): void {
    this.cropperMode = mode;
    this.imageChangedEvent = event;
    this.croppedImagePreview.set(null);
    this.croppedBlob.set(null);
    this.isCropperLoading.set(true); // volta a "carregando" a cada nova imagem
    this.showCropper.set(true);
  }

  cancelCrop(): void {
    this.resetFileInput();
    this.showCropper.set(false);
    this.imageChangedEvent = null;
    this.croppedImagePreview.set(null);
  }

  confirmCrop(): void {
    const blob = this.croppedBlob();
    const base64 = this.croppedImagePreview();

    if (!blob && !base64) {
      console.warn('Nenhuma imagem recortada disponível ainda.');
      return;
    }

    const filename = `foto-${Date.now()}.jpg`;
    const file = blob
      ? new File([blob], filename, { type: blob.type || 'image/jpeg' })
      : this.dataUrlToFile(base64!, filename);

    const previewUrl = base64 ?? URL.createObjectURL(blob!);

    if (this.cropperMode === 'create') {
      this.listPhotoFile.set(file);
      this.listPhotoPreview.set(previewUrl);
    } else {
      this.editPhotoFile.set(file);
      this.editPhotoPreview.set(previewUrl);
    }

    this.resetFileInput();
    this.showCropper.set(false);
    this.imageChangedEvent = null;
    this.croppedImagePreview.set(null);
    this.croppedBlob.set(null);
  }

  private resetFileInput(): void {
    const target = this.imageChangedEvent?.target as HTMLInputElement | undefined;
    if (target) target.value = '';
  }

  private dataUrlToFile(dataUrl: string, filename: string): File {
    const [header, base64Data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
  }

  onImageLoaded(): void {
    console.log('✅ Imagem carregada no cropper');
  }

  onCropperReady(): void {
    console.log('✅ Cropper pronto');
  }

  onLoadImageFailed(): void {
    console.error('❌ Falha ao carregar imagem no cropper');
    this.isCropperLoading.set(false);
    this.errorMessage.set('Não foi possível carregar essa imagem. Tente outra foto.');
    this.showCropper.set(false);
  }

  imageCropped(event: ImageCroppedEvent): void {
    console.log('✂️ imageCropped disparado', event);
    if (event.base64) {
      this.croppedImagePreview.set(event.base64);
    } else if (event.objectUrl) {
      this.croppedImagePreview.set(event.objectUrl);
    }
    this.croppedBlob.set(event.blob ?? null);
    this.isCropperLoading.set(false); // agora sim está pronto pra aplicar
  }

  removePhoto(mode: 'create' | 'edit'): void {
    if (mode === 'create') {
      this.listPhotoFile.set(null);
      this.listPhotoPreview.set(null);
    } else {
      this.editPhotoFile.set(null);
      this.editPhotoPreview.set(null);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
