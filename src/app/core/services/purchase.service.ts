import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfig } from '../config/api-config';
import { Observable } from 'rxjs';

export interface Purchase {
  id?: number;
  productId: number;
  productName?: string;
  guestName: string;
  guestContact: string;
  quantity: number;
  message: string;
  status?: string;
  purchaseDate?: string;
  pricePaid?: number;
}

export interface PurchasesSummary {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  totalConfirmedValue: number;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = ApiConfig.baseUrl;

  createPurchase(purchase: Purchase): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/purchases`, purchase);
  }

  getPurchasesByGiftList(giftListId: number): Observable<Purchase[]> {
    return this.http.get<Purchase[]>(`${this.baseUrl}/purchases/gift-list/${giftListId}`);
  }

  getPurchasesByProduct(productId: number): Observable<Purchase[]> {
    return this.http.get<Purchase[]>(`${this.baseUrl}/purchases/product/${productId}`);
  }

  confirmPurchaseManually(purchaseId: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/purchases/${purchaseId}/confirm`, {});
  }

  getSummaryByGiftList(giftListId: number): Observable<PurchasesSummary> {
    return this.http.get<PurchasesSummary>(
      `${this.baseUrl}/purchases/gift-list/${giftListId}/summary`
    );
  }

  cancelPurchase(purchaseId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/purchases/${purchaseId}`);
  }

  deletePurchasePermanent(purchaseId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/purchases/${purchaseId}/permanent`);
  }
}
