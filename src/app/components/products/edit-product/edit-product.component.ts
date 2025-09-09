import { Component, input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../shared/services/private_services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Producto } from '../../../shared/models/product.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.scss',
})
export class EditProductComponent implements OnInit {
  productForm!: FormGroup;
  productId!: string;
  product!: Producto;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      categoria: ['', Validators.required],
      grupo: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      precio: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit() {
    // Tomar el ID del producto desde la ruta
    this.productId = this.route.snapshot.paramMap.get('id')!;

    // Inicializar formulario vacío
    this.productForm = this.fb.group({
      nombre_producto: ['', Validators.required],
      categoria: ['', Validators.required],
      grupo: [''],
      descripcion: [''],
      stock: [0, Validators.required],
      precio: [0, Validators.required],
      imagen_url: [''],
      presentacion_multiple: [false],
      disponible: [true],
    });

    // Cargar datos del producto
    this.loadProduct();
  }

  loadProduct() {
    // Suponiendo que tienes un método getProductById
    this.productService.getProductsByStore(this.productId).subscribe({
      next: (res) => {
        // Si tu API devuelve un array, toma el primero
        this.product = res.data[0];
        this.productForm.patchValue({
          nombre_producto: this.product.nombre_producto,
          categoria: this.product.categoria,
          grupo: this.product.grupo,
          descripcion: this.product.descripcion,
          stock: this.product.stock,
          precio: this.product.precio,
          imagen_url: this.product.imagen_url.join(', '),
          presentacion_multiple: this.product.presentacion_multiple,
          disponible: this.product.disponible,
        });
      },
      error: (err) => console.error(err),
    });
  }

  saveProduct() {
    const updatedProduct = {
      ...this.productForm.value,
      imagen_url: this.productForm.value.imagen_url
        .split(',')
        .map((url: string) => url.trim()),
    };

    this.productService
      .updateProduct(this.productId, updatedProduct)
      .subscribe({
        next: () => {
          console.log('Producto actualizado');
          this.router.navigate(['/products']); // redirigir a la lista de productos
        },
        error: (err) => console.error(err),
      });
  }
}
