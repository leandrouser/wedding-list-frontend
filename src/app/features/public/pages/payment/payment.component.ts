import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService } from '../../../../core/services/payment.service';
import { GiftItem } from '../../../../core/services/product.service';
import { GiftListService } from '../../../../core/services/gift-list.service';
import { StoreService } from '../../../../core/services/store.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly giftListService = inject(GiftListService);
  private readonly storeService = inject(StoreService);

  protected readonly step = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly errorMessage = signal<string | null>(null);

  protected product: GiftItem | null = null;
  protected guestName = '';
  protected guestContact = '';
  protected guestEmail = '';
  protected guestCpf = '';
  protected guestMessage = '';
  protected quantity = 1;
  protected coupleWhatsapp = '';
  protected giftListId: number | null = null;
  protected uniqueLink: string | null = null;
  protected listTitle = '';
  protected storeWhatsapp = '';

  protected paymentUrl: string | null = null;
  protected purchaseId: string | null = null;

  ngOnInit(): void {
    const currentNav = this.router.getCurrentNavigation();
    const state = currentNav?.extras?.state;
    const historyState = history.state;

    if (state?.['product']) {
      this.initFromState(state);
    } else if (historyState?.product) {
      this.initFromState(historyState);
    } else {
      this.step.set('error');
      this.errorMessage.set('Dados de pagamento inválidos. Por favor, volte e selecione o presente novamente.');
      return;
    }

    this.loadListTitle();
    this.createPreference();
  }

  private initFromState(state: any): void {
    this.product = state.product;
    this.guestName = state.guestName;
    this.guestContact = state.guestContact;
    this.guestEmail = state.guestEmail;
    this.guestCpf = state.guestCpf;
    this.guestMessage = state.message;
    this.coupleWhatsapp = state.coupleWhatsapp;
    this.giftListId = state.giftListId;
    this.uniqueLink = state.uniqueLink;
  }

  private loadListTitle(): void {
    if (!this.uniqueLink) return;
    this.giftListService.getGiftListByLink(this.uniqueLink).subscribe({
      next: (list) => {
        this.listTitle = list.giftTitle ?? '';
        this.storeWhatsapp = this.formatWhatsapp(list.storeWhatsapp ?? '');
      },
      error: () => { /* falha silenciosa: mensagem/contato caem sem esses dados */ }
    });
  }

  private formatWhatsapp(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  }

  createPreference(): void {
    if (!this.product || !this.product.id) return;

    this.step.set('loading');
    this.errorMessage.set(null);

    this.paymentService.createPreference({
      productId: this.product.id,
      productName: this.product.name,
      price: this.product.price,
      quantity: this.quantity,
      buyerName: this.guestName,
      buyerContact: this.guestContact,
      buyerEmail: this.guestEmail,
      buyerCpf: this.guestCpf,
      message: this.guestMessage,
      giftListId: this.giftListId
    }).subscribe({
      next: (res) => {
        this.paymentUrl = res.initPoint;
        this.purchaseId = res.purchaseId;
        this.step.set('ready');
      },
      error: (err) => {
        console.error(err);
        this.step.set('error');
        this.errorMessage.set('Erro ao gerar o link de pagamento. O servidor pode estar indisponível.');
      }
    });
  }

  pay(): void {
    if (this.paymentUrl) {
      window.location.href = this.paymentUrl;
    }
  }

  contactStore(): void {
    if (!this.product || !this.storeWhatsapp) return;

    const listPart = this.listTitle ? ` da lista "${this.listTitle}"` : '';
    const msg =
      `Olá! Meu nome é ${this.guestName}.\n` +
      `Estou entrando em contato sobre o presente${listPart}.\n` +
      `Produto: ${this.product.name}`;

    const encodedMsg = encodeURIComponent(msg);
    window.open(`https://wa.me/${this.storeWhatsapp}?text=${encodedMsg}`, '_blank');
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
