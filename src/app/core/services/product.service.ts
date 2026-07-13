import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfig } from '../config/api-config';
import { Observable, map } from 'rxjs';

export enum ProductStatus {
  AVAILABLE,
  PARTIALLY_PURCHASED,
  PURCHASED
}

export interface ProductCreateDTO {
  giftListId: number;
  name: string;
  description: string;
  quantity: number;
  price: number;
  photoUrl: string;
}

export interface ProductResponseDTO {
  id: number;
  name: string;
  description: string;
  quantity: number;
  availableQuantity: number;
  price: number;
  photoUrl: string;
  ProductStatus: string;
}

export interface ProductUpdateDTO {
  name: string;
  description: string;
  quantity: number;
  price: number;
  photoUrl: string;
}

export interface GiftItem {
  id?: number;
  name: string;
  price: number;
  quantity: number;
  availableQuantity?: number;
  description?: string;
  photoUrl?: string;
  isPurchased?: boolean;
  giftListId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = ApiConfig.baseUrl;

  getProductsByGiftList(giftListId: number): Observable<GiftItem[]> {
    return this.http.get<GiftItem[]>(`${this.baseUrl}/products/gift-list/${giftListId}`).pipe(
      map(items => items.map(item => ({
        ...item,
        isPurchased: (item as any).status === 'PURCHASED' || item.isPurchased === true
      })))
    );
  }

  getProductById(productId: number): Observable<GiftItem> {
    return this.http.get<GiftItem>(`${this.baseUrl}/products/${productId}`).pipe(
      map(item => ({
        ...item,
        isPurchased: (item as any).status === 'PURCHASED' || item.isPurchased === true
      }))
    );
  }

  createProduct(giftListId: number, product: GiftItem): Observable<void> {
    const payload = {
      ...product,
      giftListId,
      photoUrl: product.photoUrl && product.photoUrl.startsWith('http') ? product.photoUrl : null
    };
    return this.http.post<void>(`${this.baseUrl}/products`, payload);
  }

  updateProduct(productId: number, product: GiftItem): Observable<void> {
    const payload = {
      ...product,
      photoUrl: product.photoUrl && product.photoUrl.startsWith('http') ? product.photoUrl : null
    };
    return this.http.put<void>(`${this.baseUrl}/products/${productId}`, payload);
  }

  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${productId}`);
  }

  uploadToCloudinary(file: File): Observable<string> {
    const cloudName = ApiConfig.cloudinaryCloudName;
    const preset = ApiConfig.cloudinaryUploadPreset;
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);

    return this.http.post<any>(url, formData).pipe(
      map(res => res.secure_url as string)
    );
  }
}
