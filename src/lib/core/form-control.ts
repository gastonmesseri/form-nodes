import { computed, signal, type Signal } from '@angular/core';
import type { HiddenFunctionMembers } from './hidden-function-members';
import { runValidators, type ValidationErrors, type Validators } from './validation';

export type ControlApi<TValue> = {
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

export type Control<TValue> =
  & { (): TValue; api: ControlApi<TValue> }
  & Omit<ControlApi<TValue>, 'patch'>
  & HiddenFunctionMembers;

export const control = <TValue>(
  value?: TValue,
  validators?: Validators<NoInfer<TValue>>,
): Control<TValue> => {
  const controlValue = signal<TValue>(value!);
  const controlValidators = signal<Validators<TValue>>(validators ?? []);
  const controlTouched = signal(false);
  const controlDirty = signal(false);
  const controlDisabled = signal(false);
  const controlErrors = computed(() => controlDisabled()
    ? null
    : runValidators(controlValue(), controlValidators()));
  const controlValid = computed(() => controlErrors() === null);
  const set = (next: TValue) => {
    controlValue.set(next);
    controlDirty.set(true);
  };
  const reset = (...args: [] | [value: TValue]) => {
    if (args.length === 1) controlValue.set(args[0]);
    controlTouched.set(false);
    controlDirty.set(false);
  };
  const members = {
    value: controlValue.asReadonly(),
    set,
    reset,
    validators: controlValidators.asReadonly(),
    setValidators: (next: Validators<TValue>) => controlValidators.set(next),
    errors: controlErrors,
    valid: controlValid,
    invalid: computed(() => !controlValid()),
    touched: controlTouched.asReadonly(),
    untouched: computed(() => !controlTouched()),
    markAsTouched: () => { if (!controlDisabled()) controlTouched.set(true); },
    markAsUntouched: () => controlTouched.set(false),
    dirty: controlDirty.asReadonly(),
    pristine: computed(() => !controlDirty()),
    markAsDirty: () => controlDirty.set(true),
    markAsPristine: () => controlDirty.set(false),
    disabled: controlDisabled.asReadonly(),
    enabled: computed(() => !controlDisabled()),
    disable: () => controlDisabled.set(true),
    enable: () => controlDisabled.set(false),
  };
  const api: ControlApi<TValue> = { ...members, patch: set };
  return Object.assign(() => controlValue(), members, { api }) as Control<TValue>;
};
