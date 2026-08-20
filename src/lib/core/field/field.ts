import { computed, signal, type Signal } from '@angular/core';
import type { HiddenFunctionMembers } from '../types/hidden-function-members';
import {
  runValidators,
  type ValidationErrors,
  type Validators,
} from '../validation/validation';

export type FieldApi<TValue> = {
  value: Signal<TValue>;
  set: (value: TValue) => void;
  patch: (value: TValue) => void;
  reset: (...args: [] | [value: TValue]) => void;
  validators: Signal<Validators<TValue>>;
  setValidators: (validators: Validators<TValue>) => void;
  errors: Signal<ValidationErrors | null>;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  touched: Signal<boolean>;
  untouched: Signal<boolean>;
  markAsTouched: () => void;
  markAsUntouched: () => void;
  dirty: Signal<boolean>;
  pristine: Signal<boolean>;
  markAsDirty: () => void;
  markAsPristine: () => void;
  disabled: Signal<boolean>;
  enabled: Signal<boolean>;
  disable: () => void;
  enable: () => void;
};

export type Field<TValue> =
  & { (): TValue; api: FieldApi<TValue> }
  & Omit<FieldApi<TValue>, 'patch'>
  & HiddenFunctionMembers;

export const field = <TValue>(
  value?: TValue,
  validators?: Validators<NoInfer<TValue>>,
): Field<TValue> => {
  const fieldValue = signal<TValue>(value!);
  const fieldValidators = signal<Validators<TValue>>(validators ?? []);
  const fieldTouched = signal(false);
  const fieldDirty = signal(false);
  const fieldDisabled = signal(false);
  const fieldErrors = computed(() => fieldDisabled()
    ? null
    : runValidators(fieldValue(), fieldValidators()));
  const fieldValid = computed(() => fieldErrors() === null);
  const set = (next: TValue) => {
    fieldValue.set(next);
    fieldDirty.set(true);
  };
  const reset = (...args: [] | [value: TValue]) => {
    if (args.length === 1) fieldValue.set(args[0]);
    fieldTouched.set(false);
    fieldDirty.set(false);
  };
  const members = {
    value: fieldValue.asReadonly(),
    set,
    reset,
    validators: fieldValidators.asReadonly(),
    setValidators: (next: Validators<TValue>) => fieldValidators.set(next),
    errors: fieldErrors,
    valid: fieldValid,
    invalid: computed(() => !fieldValid()),
    touched: fieldTouched.asReadonly(),
    untouched: computed(() => !fieldTouched()),
    markAsTouched: () => { if (!fieldDisabled()) fieldTouched.set(true); },
    markAsUntouched: () => fieldTouched.set(false),
    dirty: fieldDirty.asReadonly(),
    pristine: computed(() => !fieldDirty()),
    markAsDirty: () => fieldDirty.set(true),
    markAsPristine: () => fieldDirty.set(false),
    disabled: fieldDisabled.asReadonly(),
    enabled: computed(() => !fieldDisabled()),
    disable: () => fieldDisabled.set(true),
    enable: () => fieldDisabled.set(false),
  };
  const api: FieldApi<TValue> = { ...members, patch: set };
  return Object.assign(() => fieldValue(), members, { api }) as Field<TValue>;
};
