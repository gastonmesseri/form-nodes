import { Validators, type AbstractControl, type ControlValueAccessor, type FormControlStatus, type ValidationErrors, type ValidatorFn } from '@angular/forms';

import { arrayToObject } from '../utils/array-to-object';
import type { InternalNode, Node } from '../types/node.type';

const toValidationErrors = (node: Node): ValidationErrors | null => {
  const errors = node.$api.errors();
  if (errors.length === 0) return null;
  return arrayToObject(errors, error => [error.kind, error]);
};

export class FormNodeNgControl {
  constructor(private readonly getNode: () => Node) {}

  readonly control = this as unknown as AbstractControl;
  valueAccessor: ControlValueAccessor | null = null;

  get value(): unknown { return (this.getNode() as InternalNode).$api._controlValue(); }
  get valid(): boolean { return this.getNode().$api.valid(); }
  get invalid(): boolean { return this.getNode().$api.invalid(); }
  get pending(): boolean { return this.getNode().$api.pending(); }
  get disabled(): boolean { return this.getNode().$api.disabled(); }
  get enabled(): boolean { return this.getNode().$api.enabled(); }
  get errors(): ValidationErrors | null { return toValidationErrors(this.getNode()); }
  get pristine(): boolean { return this.getNode().$api.pristine(); }
  get dirty(): boolean { return this.getNode().$api.dirty(); }
  get touched(): boolean { return this.getNode().$api.touched(); }
  get untouched(): boolean { return this.getNode().$api.untouched(); }

  get status(): FormControlStatus {
    if (this.disabled) return 'DISABLED';
    if (this.valid) return 'VALID';
    if (this.invalid) return 'INVALID';
    return 'PENDING';
  }

  hasValidator(validator: ValidatorFn): boolean {
    return validator === Validators.required && this.getNode().$api.required();
  }

  updateValueAndValidity() {}
}
