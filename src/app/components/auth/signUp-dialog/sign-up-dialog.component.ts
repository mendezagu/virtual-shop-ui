import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DynamicDialogConfig, DialogService } from 'primeng/dynamicdialog';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, RegisterData } from '../../../shared/services/private_services/auth.service';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { launchConfetti } from '../../../shared/utils/confetti'; // 👈 importa la función
import { SignInDialogComponent } from '../signIn-dialog/sign-in-dialog.component';

@Component({
  selector: 'app-sign-up-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, InputTextModule, ButtonModule],
  templateUrl: './sign-up-dialog.component.html',
  styleUrls: ['./sign-up-dialog.component.scss'],
  providers: [DialogService]
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
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private storeService: StoreService,
    private http: HttpClient,
    private router: Router,
    private dialogService: DialogService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
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
    const selectedPlan = localStorage.getItem('selectedPlan') || 'gratis';
    const payload = { ...data, planSeleccionado: selectedPlan };

    this.auth.register(payload).subscribe({
      next: (user) => {
        console.log(`✅ Usuario registrado con plan ${selectedPlan}:`, user);

        // 🔹 Mostrar mensaje de éxito y confeti
        this.successMessage = '🎉 Te has registrado correctamente';
        launchConfetti();

        setTimeout(() => {
          this.successMessage = '';
          this.loading = false;

          // 🔹 Cerrar este diálogo
          this.ref.close();

          // 🔹 Abrir el diálogo de inicio de sesión
          this.dialogService.open(SignInDialogComponent, {
            header: 'Iniciá Sesión',
            width: '400px',
            closable: true,
          });
        }, 5000);
      },
      error: (err) => {
        console.error('❌ Error al registrar usuario:', err);
        this.error = 'No se pudo registrar el usuario.';
        this.loading = false;
      },
    });
  }

  registerWithGoogle() {
    console.log('Registrar con Google...');
  }

  closeDialog() {
    this.ref.close();
  }
}
