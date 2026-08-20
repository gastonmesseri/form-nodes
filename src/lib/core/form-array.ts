import { computed, signal } from '@angular/core';
import type { AbstractControl } from './types';

export class FormArray<T> implements AbstractControl<T[]> {
  readonly #structureRevision = signal(0);
  readonly dirty = signal(false);
  readonly touched = signal(false);
  readonly value;
  readonly errors;
  readonly status;

  constructor(readonly controls: AbstractControl<T>[]) {
    this.value = computed(() => {
      this.#structureRevision();
      return this.controls.map((control) => control.value());
    });
    this.errors = computed(() => {
      this.#structureRevision();
      return this.controls.flatMap((control, index) =>
        control.errors().map((error) => `${index}: ${error}`),
      );
    });
    this.status = computed(() => (this.errors().length === 0 ? 'valid' : 'invalid'));
  }

  push(control: AbstractControl<T>): void {
    this.controls.push(control);
    this.#structureRevision.update((revision) => revision + 1);
    this.dirty.set(true);
  }

  removeAt(index: number): void {
    this.controls.splice(index, 1);
    this.#structureRevision.update((revision) => revision + 1);
    this.dirty.set(true);
  }

  setValue(value: T[]): void {
    if (value.length !== this.controls.length) {
      throw new Error('FormArray value length must match its controls length.');
    }
    this.controls.forEach((control, index) => control.setValue(value[index] as T));
    this.dirty.set(true);
  }

  reset(value?: T[]): void {
    if (value !== undefined && value.length !== this.controls.length) {
      throw new Error('FormArray value length must match its controls length.');
    }
    this.controls.forEach((control, index) =>
      value === undefined ? control.reset() : control.reset(value[index] as T),
    );
    this.dirty.set(false);
    this.touched.set(false);
  }

  markAsTouched(): void {
    this.controls.forEach((control) => control.markAsTouched());
    this.touched.set(true);
  }
}
