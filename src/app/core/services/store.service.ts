import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfig } from '../config/api-config';
import { Observable } from 'rxjs';

export interface Store {
  id?: number;
  name: string;
  pixKey: string;
  whatsapp: string;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = ApiConfig.baseUrl;

  getMyStore(): Observable<Store> {
    return this.http.get<Store>(`${this.baseUrl}/stores`);
  }

  saveOrUpdate(data: Store): Observable<Store> {
    return this.http.post<Store>(`${this.baseUrl}/stores`, data);
  }
}