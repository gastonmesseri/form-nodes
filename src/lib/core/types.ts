import type { Signal, WritableSignal } from '@angular/core';

export type ControlStatus = 'valid' | 'invalid';
export type Validator<T> = (value: T) => string | null;

/** Common shape shared by fields, groups, and arrays. */
export interface AbstractControl<T> {
  readonly value: Signal<T>;
  readonly errors: Signal<readonly string[]>;
  readonly status: Signal<ControlStatus>;
  readonly dirty: WritableSignal<boolean>;
  readonly touched: WritableSignal<boolean>;
  setValue(value: T): void;
  reset(value?: T): void;
  markAsTouched(): void;
}
