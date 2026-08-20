import { computed, signal, type Signal } from '@angular/core';
import type { HiddenFunctionMembers } from '../types/hidden-function-members';
import type { NodePatch, NodeSet, Nodes, NodeValue } from '../types/node';
import { runValidators } from '../validation/run-validators';
import type { ValidationErrors, Validators } from '../validation/validation';

export type FormValue<TNodes extends Nodes> = {
  [K in keyof TNodes]: NodeValue<TNodes[K]>;
};
export type FormSet<TNodes extends Nodes> = {
  [K in keyof TNodes]: NodeSet<TNodes[K]>;
};
export type FormPatch<TNodes extends Nodes> = {
  [K in keyof TNodes]?: NodePatch<TNodes[K]>;
};

export type FormApi<TNodes extends Nodes> = {
  value: Signal<FormValue<TNodes>>;
  set: (value: FormSet<TNodes>) => void;
  patch: (value: FormPatch<TNodes>) => void;
  reset: (...args: [] | [value: FormSet<TNodes>]) => void;
  validators: Signal<Validators<FormValue<TNodes>>>;
  setValidators: (validators: Validators<FormValue<TNodes>>) => void;
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

export type Form<TNodes extends Nodes> =
  & { (): FormValue<TNodes>; api: FormApi<TNodes> }
  & TNodes
  & HiddenFunctionMembers<keyof TNodes>;

export const form = <TNodes extends Nodes & { api?: never }>(
  controls: TNodes,
  validators?: Validators<NoInfer<FormValue<TNodes>>>,
): Form<TNodes> => {
  const controlKeys = () => Object.keys(controls) as (keyof TNodes)[];
  const formValue = computed(() => {
    const value = {} as FormValue<TNodes>;
    controlKeys().forEach((key) => { value[key] = controls[key]!(); });
    return value;
  });
  const formValidators = signal<Validators<FormValue<TNodes>>>(validators ?? []);
  const formErrors = computed(() => runValidators(formValue(), formValidators()));
  const formValid = computed(() =>
    formErrors() === null && controlKeys().every((key) => controls[key]!.api.valid()),
  );
  const formTouched = computed(() =>
    controlKeys().some((key) => controls[key]!.api.touched()),
  );
  const formDirty = computed(() =>
    controlKeys().some((key) => !controls[key]!.api.disabled() && controls[key]!.api.dirty()),
  );
  const formDisabled = computed(() =>
    controlKeys().every((key) => controls[key]!.api.disabled()),
  );
  const set = (value: FormSet<TNodes>) => {
    (Object.keys(value) as (keyof TNodes)[]).forEach((key) => {
      const control = controls[key];
      if (control === undefined) {
        console.warn(`form: unknown key "${String(key)}" ignored on set`);
        return;
      }
      control.api.set(value[key]);
    });
  };
  const patch = (value: FormPatch<TNodes>) => {
    (Object.keys(value) as (keyof TNodes)[]).forEach((key) => {
      const control = controls[key];
      if (control === undefined) {
        console.warn(`form: unknown key "${String(key)}" ignored on patch`);
        return;
      }
      control.api.patch(value[key]);
    });
  };
  const reset = (...args: [] | [value: FormSet<TNodes>]) => {
    if (args.length === 0) {
      controlKeys().forEach((key) => controls[key]!.api.reset());
      return;
    }
    const value = args[0];
    controlKeys().forEach((key) => controls[key]!.api.reset(value[key]));
  };
  const api: FormApi<TNodes> = {
    value: formValue,
    set,
    patch,
    reset,
    validators: formValidators.asReadonly(),
    setValidators: (next) => formValidators.set(next),
    errors: formErrors,
    valid: formValid,
    invalid: computed(() => !formValid()),
    touched: formTouched,
    untouched: computed(() => !formTouched()),
    markAsTouched: () => controlKeys().forEach((key) => controls[key]!.api.markAsTouched()),
    markAsUntouched: () => controlKeys().forEach((key) => controls[key]!.api.markAsUntouched()),
    dirty: formDirty,
    pristine: computed(() => !formDirty()),
    markAsDirty: () => controlKeys().forEach((key) => controls[key]!.api.markAsDirty()),
    markAsPristine: () => controlKeys().forEach((key) => controls[key]!.api.markAsPristine()),
    disabled: formDisabled,
    enabled: computed(() => !formDisabled()),
    disable: () => controlKeys().forEach((key) => controls[key]!.api.disable()),
    enable: () => controlKeys().forEach((key) => controls[key]!.api.enable()),
  };
  return Object.defineProperties(
    () => formValue(),
    Object.getOwnPropertyDescriptors({ ...controls, api }),
  ) as Form<TNodes>;
};
