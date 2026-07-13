import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService } from '../../../../core/services/payment.service';
import { GiftItem } from '../../../../core/services/product.service';

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

  protected readonly step = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly errorMessage = signal<string | null>(null);

  protected product: GiftItem | null = null;
  protected guestName = '';
  protected guestContact = '';
  protected guestMessage = '';
  protected quantity = 1;
  protected coupleWhatsapp = '';
  protected giftListId: number | null = null;

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

    this.createPreference();
  }

  private initFromState(state: any): void {
    this.product = state.product;
    this.guestName = state.guestName;
    this.guestContact = state.guestContact;
    this.guestMessage = state.message;
    this.quantity = state.quantity;
    this.coupleWhatsapp = state.coupleWhatsapp;
    this.giftListId = state.giftListId;
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

  notifyCouple(): void {
    if (!this.coupleWhatsapp || !this.product) return;
    
    const phone = this.coupleWhatsapp.replace(/\D/g, '');
    let msg = `🎁 Novo presente comprado!\n`;
    msg += `Presente: ${this.product.name}\n`;
    msg += `Quantidade: ${this.quantity}\n`;
    msg += `Convidado: ${this.guestName}\n`;
    msg += `Contato: ${this.guestContact}\n`;
    if (this.guestMessage) {
      msg += `Mensagem: ${this.guestMessage}`;
    }

    const encodedMsg = encodeURIComponent(msg);
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
