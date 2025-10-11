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
      public ref: DynamicDialogRef
  ) {}

  passwordsMatch(): boolean {
    const pass = this.form.get('password')?.value;
    const confirm = this.form.get('confirm_password')?.value;
    return pass === confirm;
  }

  submit() {
    if (this.form.invalid || !this.passwordsMatch()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const data = this.form.value as RegisterData;

    this.auth.register(data).subscribe({
      next: () => {
        this.loading = false;
        this.ref.close(); // cierra el diálogo
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo registrar el usuario. Intentalo más tarde.';
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
