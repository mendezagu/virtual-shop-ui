import { Producto } from "./product.model";

// shared/models/store.model.ts
export interface Store {
  nombre_tienda: string;
  rubro: string[];
  telefono_contacto: string;
  link_tienda: string;   // generado por backend
  usuario_login: string;
  password_hash: string;
  id_tienda: string;     // generado por backend

  // si sumaste opcionales en backend:
  email_contacto?: string;
  redes_sociales?: string[];
  direccion?: string;
  ciudad?: string;
  horario_apertura?: string;
  horario_cierre?: string;
  latitud?: number;
  longitud?: number;
  primary_color?: string;   // color primario de la tienda
  secondary_color?: string; // color secundario de la tienda
  background_color?: string;
  logo_url?: string
  portada_url?: string
  products?: Producto[];
}

// Lo que ENVIÁS al crear
export interface CreateStoreDto {
  nombre_tienda: string;
  rubro?: string[];              // opcional si tu backend lo admite vacío
  telefono_contacto?: string;
  usuario_login?: string;
  password_hash?: string;
  email_contacto?: string;
  redes_sociales?: string[];
  direccion?: string;
  ciudad?: string;
  horario_apertura?: string;
  horario_cierre?: string;
  latitud?: number;
  longitud?: number;
  primary_color?: string;   // color primario de la tienda
  secondary_color?: string; // color secundario de la tienda
  background_color?: string;
  portada_url?: string
  logo_url?: string
}

// Lo que ENVIÁS al actualizar
export type UpdateStoreDto = Partial<CreateStoreDto>;