import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfig } from '../config/api-config';
import { Observable, switchMap, of, map } from 'rxjs';

export interface GiftList {
  id?: number;
  giftTitle: string;
  coupleName: string;
  eventDate: string;
  storePix?: string;
  coupleWhatsapp: string;
  storeWhatsapp?: string;
  photoUrl?: string;
  couplePhotoUrl?: string;
  uniqueLink?: string;
  products?: any[];
   hasCouple?: boolean;
  coupleUsername?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GiftListService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = ApiConfig.baseUrl;

  getAllPublicLists(): Observable<GiftList[]> {
    return this.http.get<GiftList[]>(`${this.baseUrl}/gift-lists/public`).pipe(
      map(lists => lists.map(l => ({
        ...l,
        photoUrl: l.photoUrl || l.couplePhotoUrl
      })))
    );
  }

  getGiftListById(id: number): Observable<GiftList> {
    return this.http.get<GiftList>(`${this.baseUrl}/gift-lists/${id}`).pipe(
      map(l => ({
        ...l,
        photoUrl: l.photoUrl || l.couplePhotoUrl
      }))
    );
  }

  getGiftListByLink(uniqueLink: string): Observable<GiftList> {
    return this.http.get<GiftList>(`${this.baseUrl}/gift-lists/link/${uniqueLink}`).pipe(
      map(l => ({
        ...l,
        photoUrl: l.photoUrl || l.couplePhotoUrl
      }))
    );
  }

  createGiftList(data: Partial<GiftList>, imageFile?: File): Observable<GiftList> {
    return this.http.post<GiftList>(`${this.baseUrl}/gift-lists`, data).pipe(
      switchMap(createdList => {
        if (imageFile && createdList.id) {
          return this.uploadPhoto(createdList.id, imageFile).pipe(
            switchMap(() => this.getGiftListById(createdList.id!))
          );
        }
        return of({
          ...createdList,
          photoUrl: createdList.photoUrl || createdList.couplePhotoUrl
        });
      })
    );
  }

  updateGiftList(id: number, data: Partial<GiftList>, imageFile?: File): Observable<GiftList> {
    return this.http.put<GiftList>(`${this.baseUrl}/gift-lists/${id}`, data).pipe(
      switchMap(updatedList => {
        if (imageFile) {
          return this.uploadPhoto(id, imageFile).pipe(
            switchMap(() => this.getGiftListById(id))
          );
        }
        return of({
          ...updatedList,
          photoUrl: updatedList.photoUrl || updatedList.couplePhotoUrl
        });
      })
    );
  }

  getAllLists(): Observable<GiftList[]> {
    return this.http.get<GiftList[]>(`${this.baseUrl}/gift-lists/public`).pipe(
      map(lists => lists.map(l => ({
        ...l,
        photoUrl: l.photoUrl || l.couplePhotoUrl
      })))
    );
  }

  deleteGiftList(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/gift-lists/${id}`);
  }

  uploadPhoto(giftListId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name || 'couple_photo.jpg');
    return this.http.post<any>(`${this.baseUrl}/gift-lists/${giftListId}/photo`, formData).pipe(
      map(res => ({
        ...res,
        photoUrl: res.photoUrl || res.couplePhotoUrl
      }))
    );
  }
}
