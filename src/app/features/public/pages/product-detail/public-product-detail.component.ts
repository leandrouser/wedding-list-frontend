import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, GiftItem } from '../../../../core/services/product.service';
import { GiftListService } from '../../../../core/services/gift-list.service';

@Component({
  selector: 'app-public-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './public-product-detail.component.html',
  styleUrls: ['./public-product-detail.component.css']
})
export class PublicProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly giftListService = inject(GiftListService);

  protected readonly product = signal<GiftItem | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly guestName = signal('');
  protected readonly guestContact = signal('');
  protected readonly guestEmail = signal('');
  protected readonly guestCpf = signal('');
  protected readonly guestMessage = signal('');
  protected readonly selectedQuantity = signal(1);

  protected coupleWhatsapp = '';
  protected giftListId = 0;
  protected uniqueLink = '';

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    const giftListId = Number(this.route.snapshot.queryParamMap.get('giftListId'));
    this.coupleWhatsapp = this.route.snapshot.queryParamMap.get('coupleWhatsapp') || '';
    this.uniqueLink = this.route.snapshot.queryParamMap.get('uniqueLink') || '';
    this.giftListId = giftListId;

    const currentNav = this.router.getCurrentNavigation();
    const stateProduct = currentNav?.extras?.state?.['product'] as GiftItem;
    const stateUniqueLink = currentNav?.extras?.state?.['uniqueLink'] as string;

    if (stateUniqueLink) {
      this.uniqueLink = stateUniqueLink;
    }

    if (stateProduct) {
      this.product.set(stateProduct);
      this.isLoading.set(false);
    } else if (productId && giftListId) {
      this.loadProductDetails(productId, giftListId);
    } else {
      this.errorMessage.set('Presente inválido ou lista de presentes não informada.');
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    window.history.back();
  }

  loadProductDetails(productId: number, giftListId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productService.getProductsByGiftList(giftListId).subscribe({
      next: (products) => {
        const prod = products.find(p => p.id === productId);
        if (prod) {
          this.product.set(prod);
        } else {
          this.errorMessage.set('Presente não encontrado.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Não foi possível carregar as informações deste presente.');
        this.isLoading.set(false);
      }
    });
  }

  getQuantityRange(): number[] {
    const prod = this.product();
    if (!prod) return [1];
    const maxQty = prod.availableQuantity !== undefined ? prod.availableQuantity : prod.quantity;
    const range: number[] = [];
    for (let i = 1; i <= Math.max(1, maxQty); i++) {
      range.push(i);
    }
    return range;
  }

  onSubmit(): void {
    const prod = this.product();
    if (!prod) return;

    if (!this.guestName().trim()) {
      alert('Por favor, informe seu nome.');
      return;
    }
    if (!this.guestContact().trim()) {
      alert('Por favor, informe seu número de contato.');
      return;
    }

    this.router.navigate(['/pagamento'], {
      state: {
        product: prod,
        guestName: this.guestName().trim(),
        guestContact: this.guestContact().trim(),
        message: this.guestMessage().trim(),
        quantity: this.selectedQuantity(),
        coupleWhatsapp: this.coupleWhatsapp,
        giftListId: this.giftListId,
        uniqueLink: this.uniqueLink
      }
    });
  }
}
