import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FileUploadModule } from 'primeng/fileupload';
import { NgxColorsModule } from 'ngx-colors';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { UploadService } from '../../../shared/services/private_services/upload.service';
import { Store } from '../../../shared/models/store.model';
import { launchConfetti } from '../../../shared/utils/confetti';
import { Router } from '@angular/router';

@Component({
  selector: 'app-store-personalization',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ColorPickerModule,
    ButtonModule,
    TooltipModule,
    NgxColorsModule,
    SelectButtonModule,
    FileUploadModule
  ],
  templateUrl: './store-personalization.component.html',
  styleUrls: ['./store-personalization.component.scss']
})
export class StorePersonalizationComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();
   @Input() storeData: any;
  storeForm!: FormGroup;
  storeId!: string;
  loading = true;

  logoPreview: string | null = null;
  bannerPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private uploadService: UploadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.storeForm = this.fb.group({
      primary_color: ['#1E90FF'],
      secondary_color: ['#FFD700'],
      background_color: ['white']
    });

    this.loadStoreData();
  }

  private loadStoreData() {
    this.storeService.getMyStores().subscribe({
      next: (stores: Store[]) => {
        if (stores.length > 0) {
          const store = stores[0];
          this.storeId = store.id_tienda;

          this.storeForm.patchValue({
            primary_color: store.primary_color || '#1E90FF',
            secondary_color: store.secondary_color || '#FFD700',
            background_color: store.background_color || 'white'
          });

          this.logoPreview = store.logo_url || null;
          this.bannerPreview = store.portada_url || null;
        } else {
          alert('⚠️ No tienes ninguna tienda creada aún.');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando tiendas:', err);
        alert('❌ No se pudieron cargar tus tiendas');
        this.loading = false;
      }
    });
  }

  async onLogoSelect(event: any) {
    const file: File = event.files[0];
    if (!file) return;

    try {
      const url = await this.uploadService.uploadFilePresigned(file, 'stores');
      this.logoPreview = url;
      this.storeService.updateStore(this.storeId, { logo_url: url }).subscribe();
    } catch {
      alert('❌ Error al subir el logo');
    }
  }

  async onBannerSelect(event: any) {
    const file: File = event.files[0];
    if (!file) return;

    try {
      const url = await this.uploadService.uploadFilePresigned(file, 'stores');
      this.bannerPreview = url;
      this.storeService.updateStore(this.storeId, { portada_url: url }).subscribe();
    } catch {
      alert('❌ Error al subir el banner');
    }
  }

onSubmit(): void {
  if (!this.storeId) {
    alert('Primero debes tener una tienda creada.');
    return;
  }

  if (this.storeForm.invalid) {
    this.storeForm.markAllAsTouched();
    return;
  }

  this.loading = true;

  const formData = {
    ...this.storeForm.value,
    logo_url: this.logoPreview,
    portada_url: this.bannerPreview
  };

  this.storeService.updateStore(this.storeId, formData).subscribe({
    next: () => {
      this.loading = false;
      this.storeForm.markAsPristine();

      // ✅ Emitimos evento al padre (Stepper)
      this.saved.emit();

      // ✅ Mostramos mensaje de éxito
      this.showSuccessToast();

      // 🎉 Confeti local (también podés usar el global)
     this.launchLocalConfetti();

      // ⏳ Esperamos unos segundos y redirigimos
      setTimeout(() => {
        this.router.navigate(['/mis-categorias']);
      }, 7000); // ⏰ Espera 3.5 segundos para que el usuario vea el efecto
    },
    error: () => {
      this.loading = false;
      alert('❌ Hubo un error al guardar los cambios');
    }
  });
}

private showSuccessToast() {
  const toast = document.createElement('div');
  toast.textContent = '🎉 ¡Tu tienda fue creada con éxito!';
  toast.className = `
    fixed left-1/2 top-1/3 -translate-x-1/2 bg-green-600 text-white 
    font-semibold px-6 py-3 rounded-2xl shadow-xl z-[9999]
    animate-fade-in-down text-center
  `;
  document.body.appendChild(toast);

  // Efecto de entrada suave
  toast.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' });

  setTimeout(() => {
    toast.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
    setTimeout(() => toast.remove(), 500);
  }, 6000); // Dura 4 segundos visible
}

private launchLocalConfetti() {
  launchConfetti();
}
}
