import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { FormControl } from '../core/form-control';

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Two-way binds a FormControl to a native input, select, or textarea. */
@Directive({
  selector: 'input[formField], select[formField], textarea[formField]',
  standalone: true,
  host: {
    '(input)': 'onInput()',
    '(blur)': 'control().markAsTouched()',
    '[attr.aria-invalid]': 'control().status() === "invalid"',
  },
})
export class FormFieldDirective<T = string> {
  readonly control = input.required<FormControl<T>>({ alias: 'formField' });
  readonly #element = inject<ElementRef<FieldElement>>(ElementRef);

  constructor() {
    effect(() => {
      const value = this.control().value();
      this.#element.nativeElement.value = value == null ? '' : String(value);
    });
  }

  protected onInput(): void {
    this.control().setValue(this.#element.nativeElement.value as unknown as T);
  }
}
