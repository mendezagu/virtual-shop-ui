import { Component, ViewChild } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/private_services/auth.service';
import { StoreService } from '../../services/private_services/store.service';

@Component({
  selector: 'app-register-step',
  standalone: true,
  imports: [
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './register-step.component.html',
  styleUrl: './register-step.component.scss',
})
export class RegisterStepComponent {
  @ViewChild('stepper') stepper!: MatStepper;
  isLinear = true;
  firstFormGroup!: FormGroup;
  secondFormGroup!: FormGroup;
  storeForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
      private authService: AuthService,
  private storeService: StoreService

  ) {}

  ngOnInit(): void {
    this.firstFormGroup = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required, Validators.minLength(8)]],
      rol: ['', Validators.required],
      fecha_creacion: [new Date(), Validators.required], // opcional, podés asignarlo automáticamente
    });

    this.storeForm = this.fb.group({
      nombre_tienda: ['', Validators.required],
      telefono_contacto: ['', Validators.required],
      link_tienda: ['', Validators.required],
      usuario_login: ['', Validators.required],
      password_hash: ['', Validators.required],
      rubro: ['', Validators.required],
    });
  }

  onSubmitFirstStep() {
    if (this.firstFormGroup.valid) {
      const password = this.firstFormGroup.get('password')!.value;
      const confirmPassword =
        this.firstFormGroup.get('confirm_password')!.value;

      if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
      }

      console.log(this.firstFormGroup.value);
      this.stepper.next();
    }
  }

onSubmitAll() {
  // Validar formularios
  if (this.firstFormGroup.invalid || this.storeForm.invalid) {
    alert('Completa todos los campos correctamente');
    return;
  }

  // Verificar que password y confirm_password coincidan
  const password = this.firstFormGroup.get('password')!.value;
  const confirmPassword = this.firstFormGroup.get('confirm_password')!.value;
  if (password !== confirmPassword) {
    alert('Las contraseñas no coinciden');
    return;
  }

  // Preparar datos del usuario, enviando confirm_password al backend
  const userDataToSend = {
    ...this.firstFormGroup.value,
    fecha_creacion: new Date(),
  };

  // Llamar al endpoint de registro
  this.authService.register(userDataToSend).subscribe({
    next: (userRes) => {
      console.log('Usuario creado:', userRes);

      // Preparar datos de la tienda
      const storeData = {
        ...this.storeForm.value,
        rubro: this.storeForm.value.rubro
          .split(',')
          .map((r: string) => r.trim()),
        userId: userRes.id, // Asociar la tienda al usuario recién creado
        fecha_creacion: new Date(),
      };

      // Enviar datos de la tienda
      this.storeService.createStore(storeData).subscribe({
        next: (storeRes) => {
          console.log('Tienda creada:', storeRes);
          alert('Usuario y tienda creados correctamente');
          this.stepper.reset();
        },
        error: (err) => {
          console.error('Error al crear la tienda', err);
          alert('Error al crear la tienda');
        },
      });
    },
    error: (err) => {
      console.error('Error al crear usuario', err);
      alert(err.error?.message || 'Error al crear usuario');
    },
  });
}



}
