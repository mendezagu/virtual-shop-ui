import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';
import { CreateStoreDto, Store, UpdateStoreDto } from '../../models/store.model';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private baseUrl = 'http://localhost:3000/api/stores';

  /** Cache en memoria de /my-stores */
  private myStoresCache$?: Observable<Store[]>;

  constructor(private http: HttpClient) {}

  /** Crea tienda y limpia cache para que la próxima lectura traiga datos frescos */
  createStore(data: CreateStoreDto): Observable<Store> {
    return this.http.post<Store>(this.baseUrl, data).pipe(
      tap(() => this.clearCache())
    );
  }

  /**
   * Devuelve las tiendas del usuario con cache en memoria.
   * Usa forceRefresh=true para forzar recarga desde el servidor.
   */
  getMyStores(forceRefresh = false): Observable<Store[]> {
    if (!this.myStoresCache$ || forceRefresh) {
      this.myStoresCache$ = this.http
        .get<Store[]>(`${this.baseUrl}/my-stores`)
        .pipe(shareReplay(1));
    }
    return this.myStoresCache$;
  }

  /** Conveniencia: primera tienda del usuario (o undefined si no hay) */
  getMyPrimaryStore(forceRefresh = false): Observable<Store | undefined> {
    return this.getMyStores(forceRefresh).pipe(map(stores => stores?.[0]));
  }

  /** Actualiza tienda y limpia cache */
  updateStore(id_tienda: string, data: UpdateStoreDto): Observable<Store> {
    return this.http.put<Store>(`${this.baseUrl}/${id_tienda}`, data).pipe(
      tap(() => this.clearCache())
    );
  }

  /** Limpia cache (útil en logout o después de crear/editar tiendas) */
  clearCache(): void {
    this.myStoresCache$ = undefined;
  }
}
