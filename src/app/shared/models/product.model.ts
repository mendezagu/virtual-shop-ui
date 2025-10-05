export interface ProductVariant {
  id_variant: string;
  nombre: string;
  stock: number;
  precio: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

export interface Producto {
  id_producto: string;
  id_tienda: string;
  nombre_producto: string;
  category?: Category | null;
  grupo: string | number;
  descripcion: string;
  stock: number;
  precio: number;
  costo: number;
  descuento: number;
  ganancia: number;
  precio_final: number;
  precio_mayorista: number;
  imagen_url: string[];
  presentacion_multiple: boolean;
  disponible: boolean;
  fecha_creacion: string;
  variants?: ProductVariant[];
  sku?: string;
  codigo_barras ?: string;
  unidad_medida ?: string[];
  condicion?: string[];
  vencimiento ?: string;
  color ?: string[];

}
