import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { JwtPayload } from '../../../shared/models/jwt-payload.model';
import jwtDecode from 'jwt-decode';

interface LoginResponse {
  access_token: string;
  user?: { id: string; email: string; name?: string };
}

export interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  //confirm_password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/auth';
  private readonly TOKEN_KEY = 'auth_token';

  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public loggedIn$ = this.loggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  // Método para registrar usuario
register(data: RegisterData): Observable<any> {
  //const { confirm_password, ...payload } = data; // 👈 eliminamos confirm_password
  return this.http.post(`${this.apiUrl}/register`, data);
}

  getUserData(): JwtPayload | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (err) {
      console.error('Token inválido', err);
      return null;
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        console.log('Respuesta del backend:', res); // 👈 para ver qué devuelve
        const token = (res as any).access_token || (res as any).token;
        if (token && isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.TOKEN_KEY, token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.loggedInSubject.next(true);
        }
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
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
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user).role : null;
}
}
