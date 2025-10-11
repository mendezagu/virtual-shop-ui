import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../shared/services/private_services/auth.service';
import { Router } from '@angular/router';
import { BrandingSideComponent } from "../../../shared/components/branding-side/branding-side.component";
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from "primeng/card";
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { SignInDialogComponent } from '../signIn-dialog/sign-in-dialog.component';
import { SignUpDialogComponent } from '../signUp-dialog/sign-up-dialog.component';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ButtonModule,
    MatCheckboxModule,
    InputTextModule,
    CardModule,
    DynamicDialogModule
],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
    providers: [DialogService],
})
export class SignInComponent {
  @Output() success = new EventEmitter<void>();

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
     password: ['', [Validators.required, Validators.minLength(6)]],
  });

  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private dialogService: DialogService
  ) {}

 openLoginDialog() {
    this.dialogService.open(SignInDialogComponent, {
      header: 'Iniciar Sesión',
      width: '90%',
      styleClass: 'custom-login-dialog',
      breakpoints: { '960px': '95vw', '640px': '100vw' },
      dismissableMask: true,
      closeOnEscape: true,
    });
  }
  
openSignUpDialog() {
  this.dialogService.open(SignUpDialogComponent, {
    header: 'Crear cuenta',
    width: '90%',
    styleClass: 'custom-login-dialog',
    breakpoints: { '960px': '95vw', '640px': '100vw' },
    dismissableMask: true,
    closeOnEscape: true,
  });
}
 
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;

    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.success.emit(); // 👈 notifica al diálogo
      },
      error: () => {
        this.error = 'Email o contraseña incorrectos';
      },
    });
  }
}
