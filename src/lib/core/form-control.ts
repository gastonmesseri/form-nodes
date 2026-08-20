import { computed, signal } from '@angular/core';
import type { AbstractControl, Validator } from './types';

export class FormControl<T> implements AbstractControl<T> {
  readonly #initialValue: T;
  readonly #value;

  readonly value;
  readonly dirty = signal(false);
  readonly touched = signal(false);
  readonly errors;
  readonly status;

  constructor(initialValue: T, validators: readonly Validator<T>[] = []) {
    this.#initialValue = initialValue;
    this.#value = signal(initialValue);
    this.value = this.#value.asReadonly();
    this.errors = computed(() =>
      validators
        .map((validator) => validator(this.#value()))
        .filter((error): error is string => error !== null),
    );
    this.status = computed(() => (this.errors().length === 0 ? 'valid' : 'invalid'));
  }

  setValue(value: T): void {
    this.#value.set(value);
    this.dirty.set(true);
  }

  reset(value: T = this.#initialValue): void {
    this.#value.set(value);
    this.dirty.set(false);
    this.touched.set(false);
  }

  markAsTouched(): void {
    this.touched.set(true);
  }
}
