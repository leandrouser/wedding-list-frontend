import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GiftListService, GiftList } from '../../../../core/services/gift-list.service';

@Component({
  selector: 'app-public-gift-lists',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './public-gift-lists.component.html',
  styleUrl: './public-gift-lists.component.css'
})
export class PublicGiftListsComponent implements OnInit {
  private readonly giftListService = inject(GiftListService);

  protected readonly giftLists = signal<GiftList[]>([]);
  protected readonly filteredLists = signal<GiftList[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly showResults = signal(false);

  searchFocused = false;

  ngOnInit(): void {
  }

  onSearchSubmit(): void {
    const term = this.searchTerm().toLowerCase().trim();

    if (!term) {
      this.showResults.set(false);
      this.filteredLists.set([]);
      return;
    }

    if (this.giftLists().length > 0) {
      this.applyFilter(term);
      this.showResults.set(true);
    } else {
      this.fetchListsFromServer(term);
    }
  }

  onPhotoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  private fetchListsFromServer(term: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.giftListService.getAllPublicLists().subscribe({
      next: (lists) => {
        this.giftLists.set(lists);
        this.applyFilter(term);
        this.showResults.set(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Não foi possível carregar as listas de presentes. O servidor está acessível?');
        this.isLoading.set(false);
      }
    });
  }

  private applyFilter(term: string): void {
    const filtered = this.giftLists().filter(list =>
      list.coupleName.toLowerCase().includes(term) ||
      (list.giftTitle && list.giftTitle.toLowerCase().includes(term))
    );
    this.filteredLists.set(filtered);
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    if (!term.trim()) {
      this.showResults.set(false);
      this.filteredLists.set([]);
    }
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
