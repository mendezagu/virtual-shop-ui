import { Component, Input, forwardRef, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl } from '@angular/forms';
import { MatError } from "@angular/material/form-field";


@Component({
  selector: 'app-textarea',
  standalone: true,
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  imports: [MatError],
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() placeholder: string = '';
  @Input() label: string = '';
  @Input() rows: number = 3; // 👈 control de altura
  @Input() control: AbstractControl | null = null;
  @Input() disabled = false;

  value: string = '';


  // callbacks
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

  handleInput(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    this.value = input.value;
    this.onChange(this.value);
  }

  // manejo de errores
  get errorMessage(): string | null {
    if (!this.control || !(this.control.dirty || this.control.touched)) return null;

    if (this.control.hasError('required')) return 'Este campo es obligatorio';
    if (this.control.hasError('minlength')) {
      return `Debe tener al menos ${(this.control.getError('minlength') as any).requiredLength} caracteres`;
    }
    return null;
  }
}
