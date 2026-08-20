import { computed, signal, type Signal } from '@angular/core';

import type { NodeApi } from '../types/node.type';
import { runValidators } from '../validation/run-validators';
import type { ValidationErrors, Validators } from '../validation/validation.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';

export type FieldOptions = {
  readonly disabled?: boolean;
  readonly readonly?: boolean;
};

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
  readonly: Signal<boolean>;
  writable: Signal<boolean>;
  markAsReadonly: () => void;
  markAsWritable: () => void;
};

export type Field<TValue> =
  & { (): TValue; api: FieldApi<TValue> }
  & Omit<FieldApi<TValue>, 'patch'>
  & HiddenFunctionMembers;

export const field = <TValue>(
  value?: TValue,
  validators?: Validators<NoInfer<TValue>>,
  options?: FieldOptions,
): Field<TValue> => {
  const fieldValue = signal<TValue>(value!);
  const fieldValidators = signal<Validators<TValue>>(validators ?? []);
  const fieldTouched = signal(false);
  const fieldDirty = signal(false);
  const fieldSelfDisabled = signal(options?.disabled ?? false);
  const fieldParent = signal<NodeApi | null>(null);
  const fieldDisabled = computed(() => fieldSelfDisabled() || fieldParent()?.disabled() === true);
  const fieldSelfReadonly = signal(options?.readonly ?? false);
  const fieldReadonly = computed(() => fieldSelfReadonly() || fieldParent()?.readonly() === true);
  const fieldNonInteractive = computed(() => fieldDisabled() || fieldReadonly());
  const fieldErrors = computed(() => fieldNonInteractive()
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
    touched: computed(() => !fieldNonInteractive() && fieldTouched()),
    untouched: computed(() => fieldNonInteractive() || !fieldTouched()),
    markAsTouched: () => { if (!fieldNonInteractive()) fieldTouched.set(true); },
    markAsUntouched: () => fieldTouched.set(false),
    dirty: computed(() => !fieldNonInteractive() && fieldDirty()),
    pristine: computed(() => fieldNonInteractive() || !fieldDirty()),
    markAsDirty: () => fieldDirty.set(true),
    markAsPristine: () => fieldDirty.set(false),
    disabled: fieldDisabled,
    enabled: computed(() => !fieldDisabled()),
    disable: () => fieldSelfDisabled.set(true),
    enable: () => fieldSelfDisabled.set(false),
    readonly: fieldReadonly,
    writable: computed(() => !fieldReadonly()),
    markAsReadonly: () => fieldSelfReadonly.set(true),
    markAsWritable: () => fieldSelfReadonly.set(false),
  };
  const api: FieldApi<TValue> = { ...members, patch: set };
  const internalApi = {
    ...api,
    _setParent: (parent: NodeApi | null) => fieldParent.set(parent),
  };
  return Object.assign(() => fieldValue(), members, { api: internalApi }) as unknown as Field<TValue>;
};
