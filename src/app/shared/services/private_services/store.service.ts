import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateStoreDto, Store, UpdateStoreDto } from '../../models/store.model';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  private baseUrl = 'http://localhost:3000/api/stores';

  constructor(private http: HttpClient) {}

  createStore(data: CreateStoreDto): Observable<Store> {
    return this.http.post<Store>(this.baseUrl, data);
  }

  getMyStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.baseUrl}/my-stores`);
  }

  updateStore(id_tienda: string, data: UpdateStoreDto): Observable<Store> {
    return this.http.put<Store>(`${this.baseUrl}/${id_tienda}`, data);
  }
}
