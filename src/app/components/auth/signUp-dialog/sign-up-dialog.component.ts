import { Component } from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuthService, RegisterData } from '../../../shared/services/private_services/auth.service';
import { Router } from '@angular/router';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sign-up-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, InputTextModule, ButtonModule],
  templateUrl: './sign-up-dialog.component.html',
  styleUrls: ['./sign-up-dialog.component.scss'],
})
export class SignUpDialogComponent {
  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{8,15}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', [Validators.required]],
  });

  error: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    public ref: DynamicDialogRef,
    private router: Router,
    private storeService: StoreService,
    private http: HttpClient,

  ) {}

  passwordsMatch(): boolean {
    const pass = this.form.get('password')?.value;
    const confirm = this.form.get('confirm_password')?.value;
    return pass === confirm;
  }

 onRegisterSuccess(user: any) {
  const selectedPlan = localStorage.getItem('selectedPlan');

  if (selectedPlan === 'gratis') {
    // Crear tienda base
    const newStore = {
      nombre_tienda: user.nombre + ' Store',
      rubro: ['General'],
      link_tienda: user.nombre.toLowerCase().replace(/\s+/g, '-') + '-shop',
    };

    this.storeService.createStore(newStore).subscribe({
      next: (store) => {
        console.log('✅ Tienda creada con éxito:', store);

        // Asignar plan gratuito
        this.http
          .post('http://localhost:3000/api/subscriptions', {
            storeId: store.id_tienda,
            planId: 1, // ID del plan gratuito
          })
          .subscribe({
            next: (res: any) => {
              console.log('🎉 Plan Gratis asignado correctamente');
              console.log('📦 Respuesta del servidor:', res); // <— imprime la respuesta completa
              console.log(
                `🟢 Plan: ${res.subscription.plan.nombre}, Productos permitidos: ${res.subscription.plan.max_productos}`
              );

              this.loading = false;
              this.router.navigate(['/dashboard']);
            },
            error: (err) => {
              console.error('❌ Error al asignar plan:', err);
              this.loading = false;
            },
          });
      },
      error: (err) => {
        console.error('❌ Error al crear tienda:', err);
        this.loading = false;
      },
    });
  } else {
    // Si no eligió el plan gratis
    console.log('ℹ️ El usuario no seleccionó un plan gratuito.');
    this.loading = false;
    this.router.navigate(['/dashboard']);
  }
}

submit() {
  if (this.form.invalid || !this.passwordsMatch()) {
    this.form.markAllAsTouched();
    return;
  }

  this.loading = true;
  const data = this.form.value as RegisterData;
  const selectedPlan = localStorage.getItem('selectedPlan') || 'gratis';

  const payload = { ...data, planSeleccionado: selectedPlan };

  this.auth.register(payload).subscribe({
    next: (user) => {
      console.log(`✅ Usuario registrado con plan ${selectedPlan}:`, user);
      this.loading = false;
      this.ref.close();
      this.router.navigate(['/login']);
    },
    error: (err) => {
      console.error('❌ Error al registrar usuario:', err);
      this.error = 'No se pudo registrar el usuario.';
      this.loading = false;
    },
  });
}


  // Opción futura: conectar con Google
  registerWithGoogle() {
    console.log('Registrar con Google...');
  }

  closeDialog() {
  this.ref.close();
}
}
