import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  AbstractControl,
} from '@angular/forms';
import { MatError } from '@angular/material/form-field';

@Component({
  selector: 'app-input',
  standalone: true,
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  imports: [MatError],
})
export class InputComponent implements ControlValueAccessor {
  @Input() placeholder: string = '';
  @Input() label: string = '';
  @Input() control: AbstractControl | null = null; // para validaciones opcionales
  @Input() disabled = false;

  @Input() type: HTMLInputElement['type'] = 'text';
  @Input() value: string | number = '';
  @Output() valueChange = new EventEmitter<string | number>();
  @Output() input = new EventEmitter<string | number>();




  // callbacks de Angular
  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {
    this.value = value ?? '';
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

  // 🔥 manejar input y emitir string
  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = this.type === 'number' ? +input.value : input.value;

    this.onChange(this.value);
    this.valueChange.emit(this.value); // ✅ dispara two-way binding
    this.input.emit(this.value); // ✅ mantiene compatibilidad
  }

  // 🔥 manejo de errores interno
  get errorMessage(): string | null {
    if (!this.control || !(this.control.dirty || this.control.touched))
      return null;

    if (this.control.hasError('required')) {
      return 'Este campo es obligatorio';
    }

    if (this.control.hasError('email')) {
      return 'El correo no es válido';
    }

    if (this.control.hasError('minlength')) {
      return `Debe tener al menos ${
        (this.control.getError('minlength') as any).requiredLength
      } caracteres`;
    }

    return null;
  }
}
