import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { JwtPayload } from '../../../shared/models/jwt-payload.model';
import jwtDecode from 'jwt-decode';
import { environment } from '../../../../environments/environment';

interface LoginResponse {
  access_token: string;
  user?: { id: string; email: string; nombre?: string; storeId?: string };
}

export interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  confirm_password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';

  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public loggedIn$ = this.loggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  // 👉 Registro
register(data: RegisterData): Observable<any> {
  return this.http.post(`${this.apiUrl}/register`, data).pipe(
    map((res: any) => res.user) // 👈 devolvés solo el usuario
  );
}

  // 👉 Login (pide al backend y guarda token en localStorage)
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        const token = res.access_token;
        if (token && isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.TOKEN_KEY, token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.loggedInSubject.next(true);
        }
      }),
    );
  }

  // 👉 Decodificar payload del JWT
  getUserData(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (err) {
      console.error('Token inválido', err);
      return null;
    }
  }

  // 👉 Logout
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem('user');
      this.loggedInSubject.next(false);
    }
  }

  isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  private hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem(this.TOKEN_KEY);
    }
    return false;
  }

getUserRole(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('role');
    }
    return null; // en servidor devolvemos null
  }
}
