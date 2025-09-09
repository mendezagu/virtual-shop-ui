export interface ProductVariant {
  id_variant: string;
  nombre: string;
  stock: number;
  precio: number;
}

export interface Producto {
  id_producto: string;
  id_tienda: string;
  nombre_producto: string;
  categoria: string;
  grupo: string | number;
  descripcion: string;
  stock: number;
  precio: number;
  imagen_url: string[];
  presentacion_multiple: boolean;
  disponible: boolean;
  fecha_creacion: string;
  variants?: ProductVariant[]; // 👈 Ahora incluye las variantes
}
