import { Validators, type AbstractControl, type ControlValueAccessor, type FormControlStatus, type ValidationErrors, type ValidatorFn } from '@angular/forms';

import type { Field } from '../../primitives/field';

const toValidationErrors = (field: Field<unknown>): ValidationErrors | null => {
  const errors = field.errors();
  if (errors.length === 0) return null;
  return Object.fromEntries(errors.map((error) => [error.kind, error]));
};

export class FormNodeNgControl {
  constructor(private readonly getField: () => Field<unknown>) {}

  readonly control = this as unknown as AbstractControl;
  valueAccessor: ControlValueAccessor | null = null;

  get value(): unknown { return this.getField().controlValue(); }
  get valid(): boolean { return this.getField().valid(); }
  get invalid(): boolean { return this.getField().invalid(); }
  get pending(): boolean { return this.getField().pending(); }
  get disabled(): boolean { return this.getField().disabled(); }
  get enabled(): boolean { return this.getField().enabled(); }
  get errors(): ValidationErrors | null { return toValidationErrors(this.getField()); }
  get pristine(): boolean { return this.getField().pristine(); }
  get dirty(): boolean { return this.getField().dirty(); }
  get touched(): boolean { return this.getField().touched(); }
  get untouched(): boolean { return this.getField().untouched(); }

  get status(): FormControlStatus {
    if (this.disabled) return 'DISABLED';
    if (this.valid) return 'VALID';
    if (this.invalid) return 'INVALID';
    return 'PENDING';
  }

  hasValidator(validator: ValidatorFn): boolean {
    return validator === Validators.required && this.getField().required();
  }

  updateValueAndValidity(): void {}
}
