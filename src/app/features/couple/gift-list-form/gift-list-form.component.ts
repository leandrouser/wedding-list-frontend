import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GiftList, GiftListService } from '../../../core/services/gift-list.service';

@Component({
  selector: 'app-gift-list-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gift-list-form.component.html',
  styleUrls: ['./gift-list-form.component.css']
})
export class GiftListFormComponent implements OnInit {
  private readonly giftListService = inject(GiftListService);
  private readonly router = inject(Router);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected successMessage = signal<string | null>(null);

  protected listId: number | null = null;
  
  protected formData = {
    giftTitle: '',
    coupleName: '',
    eventDate: '',
    coupleWhatsapp: '',
    storePix: ''
  };

  protected currentPhotoUrl: string | null = null;
  protected selectedFile: File | null = null;
  protected previewUrl: string | null = null;

  ngOnInit(): void {
    // Para simplificar, vamos buscar uma lista existente.
    // Idealmente, o backend teria um endpoint /gift-lists/my-list
    // Aqui usaremos o getAllPublicLists e pegaremos a primeira, ou deixaremos criar.
    this.loadMyList();
  }

  loadMyList(): void {
    this.isLoading.set(true);
    this.giftListService.getAllPublicLists().subscribe({
      next: (lists) => {
        if (lists && lists.length > 0) {
          // Assume que a primeira lista pertence ao usuário logado (simplificação)
          const myList = lists[0];
          this.listId = myList.id!;
          this.formData = {
            giftTitle: myList.giftTitle || '',
            coupleName: myList.coupleName || '',
            eventDate: myList.eventDate ? myList.eventDate.substring(0, 10) : '',
            coupleWhatsapp: myList.coupleWhatsapp || '',
            storePix: myList.storePix || ''
          };
          this.currentPhotoUrl = myList.photoUrl || null;
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar lista', err);
        this.isLoading.set(false);
      }
    });
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  save(): void {
    if (!this.formData.giftTitle || !this.formData.coupleName || !this.formData.eventDate) {
      this.errorMessage.set('Por favor, preencha os campos obrigatórios (Título, Nomes e Data).');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const apiCall = this.listId 
      ? this.giftListService.updateGiftList(this.listId, this.formData, this.selectedFile || undefined)
      : this.giftListService.createGiftList(this.formData, this.selectedFile || undefined);

    apiCall.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.successMessage.set('Lista salva com sucesso!');
        this.listId = res.id!;
        this.currentPhotoUrl = res.photoUrl || this.previewUrl;
        this.selectedFile = null;
        this.previewUrl = null;
        
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        console.error('Erro ao salvar', err);
        this.isSaving.set(false);
        this.errorMessage.set('Erro ao salvar as informações. Verifique a conexão.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
