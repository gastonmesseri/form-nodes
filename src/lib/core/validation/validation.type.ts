import type { Signal } from '@angular/core';

export type ValidationErrors = Record<string, any>;

/** Reactive context available to validation functions for the current field. */
export type FieldContext<TValue> = {
  /** Signal containing the current field value. */
  readonly value: Signal<TValue>;
};

export type Validator<TValue> = (context: FieldContext<TValue>) => ValidationErrors | null;
export type Validators<TValue> = readonly Validator<TValue>[];
