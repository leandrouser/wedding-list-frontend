import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, GiftItem } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-gift-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gift-item-form.component.html',
  styleUrls: ['./gift-item-form.component.css']
})
export class GiftItemFormComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  
  protected itemId: number | null = null;
  protected listId: number | null = null;
  
  protected formData = {
    name: '',
    price: 0,
    quantity: 1,
    description: ''
  };

  protected currentPhotoUrl: string | null = null;
  protected selectedFile: File | null = null;
  protected previewUrl: string | null = null;

  ngOnInit(): void {
    this.listId = this.authService.currentGiftListId;

    const state = history.state;
    if (state && state.item) {
      const item: GiftItem = state.item;
      this.itemId = item.id || null;
      this.formData = {
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        description: item.description || ''
      };
      this.currentPhotoUrl = item.photoUrl || null;
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  save(): void {
    if (!this.listId) {
      this.errorMessage.set('Não foi possível identificar sua lista de presentes.');
      return;
    }

    if (!this.formData.name || this.formData.price <= 0 || this.formData.quantity <= 0) {
      this.errorMessage.set('Preencha os campos obrigatórios com valores válidos.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const performSave = (photoUrl?: string) => {
      const payload: GiftItem = {
        id: this.itemId || undefined,
        name: this.formData.name,
        price: this.formData.price,
        quantity: this.formData.quantity,
        description: this.formData.description,
        photoUrl: photoUrl || this.currentPhotoUrl || undefined
      };

      const apiCall = this.itemId 
        ? this.productService.updateProduct(this.itemId, payload)
        : this.productService.createProduct(this.listId!, payload);

      apiCall.subscribe({
        next: () => {
          this.isSaving.set(false);
          this.router.navigate(['/admin/presentes']);
        },
        error: (err) => {
          console.error(err);
          this.isSaving.set(false);
          this.errorMessage.set('Erro ao salvar o presente.');
        }
      });
    };

    if (this.selectedFile) {
      this.productService.uploadToCloudinary(this.selectedFile).subscribe({
        next: (url) => performSave(url),
        error: (err) => {
          console.error(err);
          this.isSaving.set(false);
          this.errorMessage.set('Erro ao fazer upload da imagem.');
        }
      });
    } else {
      performSave();
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/presentes']);
  }
}
