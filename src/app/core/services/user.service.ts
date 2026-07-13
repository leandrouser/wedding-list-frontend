import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '../config/api-config';

export interface CoupleDTO {
  id: number;
  username: string;
  phoneNumber: string;
  giftListId: number;
  password: string;
}

export interface UpdateCoupleDTO {
  phoneNumber?: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = ApiConfig.baseUrl;

  getAllCouples(): Observable<CoupleDTO[]> {
    return this.http.get<CoupleDTO[]>(`${this.baseUrl}/auth/couples`);
  }

  searchCouples(username: string): Observable<CoupleDTO[]> {
    return this.http.get<CoupleDTO[]>(`${this.baseUrl}/auth/couples/search`, {
      params: { username }
    });
  }

  linkCoupleToList(coupleId: number, giftListId: number): Observable<string> {
    return this.http.patch(`${this.baseUrl}/auth/couples/${coupleId}/link-list/${giftListId}`, {}, {
      responseType: 'text'
    });
  }

  unlinkCoupleFromList(coupleId: number): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/auth/couples/${coupleId}/unlink-list`, {});
  }

  updateCouple(id: number, data: UpdateCoupleDTO): Observable<CoupleDTO> {
    return this.http.put<CoupleDTO>(`${this.baseUrl}/auth/couples/${id}`, data);
  }

  deleteCouple(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/auth/couples/${id}`);
  }

  updateCoupleLink(coupleId: number, giftListId: number): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/auth/couples/${coupleId}/link-list/${giftListId}`, {});
  }
}