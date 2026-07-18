import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ApiConfig } from '../../../../core/config/api-config';

@Component({
  selector: 'app-payment-failure',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-failure.component.html',
  styleUrls: ['./payment-failure.component.css']
})
export class PaymentFailureComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = ApiConfig.baseUrl;

  protected countdown = 5;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const giftListId = params['giftListId'];
      const purchaseId = params['external_reference'];

      if (purchaseId) {
        this.cancelPurchase(purchaseId);
      }

      const interval = setInterval(() => {
        this.countdown--;
        if (this.countdown === 0) {
          clearInterval(interval);
          if (giftListId) {
            this.router.navigate(['/lista', giftListId]);
          } else {
            this.router.navigate(['/']);
          }
        }
      }, 1000);
    });
  }

  private cancelPurchase(purchaseId: string): void {
    this.http.delete(`${this.baseUrl}/purchases/${purchaseId}`).subscribe({
      error: (err) => {
        // Falha silenciosa: se o cancelamento aqui não funcionar,
        // o PurchaseExpirationJob no backend devolve o estoque em até 30 min.
        console.warn('Não foi possível cancelar a compra automaticamente:', err);
      }
    });
  }
}
