import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GiftListService, GiftList } from '../../../../core/services/gift-list.service';
import { ProductService, GiftItem } from '../../../../core/services/product.service';

@Component({
  selector: 'app-public-gift-items',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-gift-items.component.html',
  styleUrls: ['./public-gift-items.component.css']
})
export class PublicGiftItemsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly giftListService = inject(GiftListService);
  private readonly productService = inject(ProductService);

  protected readonly giftList = signal<GiftList | null>(null);
  protected readonly products = signal<GiftItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const listId = Number(this.route.snapshot.paramMap.get('id'));
    if (listId) {
      this.loadListDetails(listId);
    } else {
      this.errorMessage.set('Lista de presentes inválida.');
      this.isLoading.set(false);
    }
  }

  loadListDetails(listId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.giftListService.getAllPublicLists().subscribe({
      next: (lists) => {
        const list = lists.find(l => l.id === listId);
        if (list) {
          this.giftList.set(list);
          // Buscar produtos pelo endpoint público específico da lista
          this.productService.getProductsByGiftList(listId).subscribe({
            next: (prods) => {
              this.products.set(prods || []);
              this.isLoading.set(false);
            },
            error: (err) => {
              console.error(err);
              this.errorMessage.set('Não foi possível carregar os produtos desta lista.');
              this.isLoading.set(false);
            }
          });
        } else {
          this.errorMessage.set('Lista de presentes não encontrada.');
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Não foi possível carregar as informações do casal.');
        this.isLoading.set(false);
      }
    });
  }

  getGiftTitleLabel(titleString?: string): string {
    switch (titleString) {
      case 'LISTA_DE_CASAMENTO': return 'Lista de Casamento';
      case 'LISTA_DE_PRESENTE': return 'Lista de Presente';
      case 'LISTA_DE_CASA_NOVA': return 'Lista de Casa Nova';
      case 'LISTA_DE_15_ANOS': return 'Lista de 15 Anos';
      default: return 'Lista de Presentes';
    }
  }
}
