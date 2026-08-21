import type { Signal } from '@angular/core';

/** A validation error associated with the node being validated. */
export type ValidationError = {
  /** Identifies the error category. */
  readonly kind: string;
  /** Optional human-readable description of the error. */
  readonly message?: string;
};

/** Indicates that validation completed without errors. */
export type ValidationSuccess = null | undefined | void;

/** A successful result, one validation error, or several validation errors. */
export type ValidationResult = ValidationSuccess | ValidationError | readonly ValidationError[];

/** Reactive context available to validation functions for the current field. */
export type FieldContext<TValue> = {
  /** Signal containing the current field value. */
  readonly value: Signal<TValue>;
};

export type Validator<TValue> = (context: FieldContext<TValue>) => ValidationResult;
export type Validators<TValue> = readonly Validator<TValue>[];
