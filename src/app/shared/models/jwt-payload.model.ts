export interface JwtPayload {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: number;
  iat?: number;
  exp?: number;
}