import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { BrandingSideComponent } from "../../../shared/components/branding-side/branding-side.component";
import { InputComponent } from '../../../shared/components/input/input.component';
import { AuthService, RegisterData } from '../../../shared/services/private_services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    BrandingSideComponent,
    InputComponent
],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  signUpForm!: FormGroup;
  success = '';
  error = '';


  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.signUpForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      password: ['', [Validators.required, Validators.minLength(8)]],
       confirm_password: ['', [Validators.required, Validators.minLength(8)]], 
    });
  }

submit(): void {
  if (this.signUpForm.invalid) return;

  const { password, confirm_password, nombre, apellido, email, telefono } = this.signUpForm.value;

  if (password !== confirm_password) {
    this.error = 'Las contraseñas no coinciden ❌';
    this.success = '';
    return;
  }

  // Construimos el objeto RegisterData sin confirm_password
  const registerData: RegisterData = {
    nombre,
    apellido,
    email,
    telefono: String(telefono), // aseguramos string
    password,
    // confirm_password ya no se envía al backend
  };

  this.authService.register(registerData).subscribe({
    next: (res) => {
      console.log('Usuario creado:', res);
      this.success = 'Usuario creado exitosamente ✅';
      this.error = '';
      this.signUpForm.reset();
    },
    error: (err) => {
      console.error('Error al registrar:', err);
      this.error = err.error?.message || 'Error al crear usuario ❌';
      this.success = '';
    }
  });
}


}
