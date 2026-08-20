import { FormArray } from './form-array';
import { FormControl } from './form-control';
import { FormGroup } from './form-group';
import type { AbstractControl, Validator } from './types';
import type { Controls } from './value-types';

export function field<T>(value: T, validators: readonly Validator<T>[] = []): FormControl<T> {
  return new FormControl(value, validators);
}

export function group<TControls extends Controls>(controls: TControls): FormGroup<TControls> {
  return new FormGroup(controls);
}

export function array<T>(controls: AbstractControl<T>[] = []): FormArray<T> {
  return new FormArray(controls);
}

/** Semantic root factory; equivalent to group(). */
export function form<TControls extends Controls>(controls: TControls): FormGroup<TControls> {
  return group(controls);
}
