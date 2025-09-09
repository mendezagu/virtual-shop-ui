import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl } from '@angular/forms';
import { MatError } from "@angular/material/form-field";

export interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  imports: [MatError],
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = 'Selecciona una opción';
  @Input() options: SelectOption[] = []; // 👈 lista de opciones
  @Input() control: AbstractControl | null = null;

  value: string | number | null = null;
  disabled = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {
    this.value = value ?? null;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.value = select.value;
    this.onChange(this.value);
  }

  get errorMessage(): string | null {
    if (!this.control || !(this.control.dirty || this.control.touched)) return null;

    if (this.control.hasError('required')) return 'Debe seleccionar una opción';
    return null;
  }
}
