import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
  template: `
  <div class="p-4 sm:p-5">
    <h2 class="text-lg font-semibold text-slate-800 mb-3">Seleccioná variante</h2>

    <div class="space-y-2 max-h-60 overflow-auto">
      <label *ngFor="let v of data.variants" class="flex items-center gap-3 rounded-xl border border-slate-200 p-2 cursor-pointer hover:bg-slate-50">
        <input type="radio" name="variant" [value]="v.id_variant" [(ngModel)]="selected" />
        <div class="flex-1">
          <div class="text-sm font-medium text-slate-800">{{ v.nombre }}</div>
          <div class="text-xs text-slate-500">Stock: {{ v.stock }}</div>
        </div>
        <div class="text-sm font-semibold">{{ v.precio | currency:'ARS':'symbol-narrow':'1.0-0' }}</div>
      </label>
    </div>

    <div class="mt-4">
      <label class="text-sm text-slate-700 mb-1 block">Cantidad</label>
      <input type="number" min="1" [(ngModel)]="qty" class="w-24 rounded-lg border border-slate-300 px-3 py-1.5" />
    </div>

    <div class="mt-5 flex justify-end gap-2">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="!selected || qty<1" (click)="confirm()">Agregar</button>
    </div>
  </div>
  `
})
export class VariantQtyDialog {
  selected?: string;
  qty = 1;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public ref: MatDialogRef<VariantQtyDialog>) {}
  confirm() { this.ref.close({ variantId: this.selected, cantidad: this.qty }); }
}
