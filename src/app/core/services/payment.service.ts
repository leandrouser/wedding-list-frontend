import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfig } from '../config/api-config';
import { Observable, map } from 'rxjs';

export interface PreferencePayload {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  buyerName: string;
  buyerContact: string;
  buyerEmail: string;
  buyerCpf: string;
  message: string;
  giftListId: number | null;
}

export interface PreferenceResponse {
  id: string;
  initPoint: string;
  purchaseId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = ApiConfig.baseUrl;

  createPreference(payload: PreferencePayload): Observable<PreferenceResponse> {
    return this.http.post<PreferenceResponse>(`${this.baseUrl}/payments/preference`, payload);
  }

  getPurchaseStatus(purchaseId: string): Observable<string> {
    return this.http.get<any>(`${this.baseUrl}/purchases/${purchaseId}/status`).pipe(
      map(res => res.status as string)
    );
  }
}
