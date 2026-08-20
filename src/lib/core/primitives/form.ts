import { computed, signal, type Signal } from '@angular/core';

import { isNode, markAsNode } from '../utils/node-marker';
import { runValidators } from '../validation/run-validators';
import type { ValidationErrors, Validators } from '../validation/validation.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { Node, NodeApi, NodeDefinition, NodeDefinitions, NodePatch, NodeSet, Nodes, NodeValue } from '../types/node.type';

export type FormOptions = {
  readonly hidden?: boolean;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
};

export type FormValue<TNodes extends Nodes> = {
  [K in keyof TNodes]: NodeValue<TNodes[K]>;
};

export type FormSet<TNodes extends Nodes> = {
  [K in keyof TNodes]: NodeSet<TNodes[K]>;
};

export type FormPatch<TNodes extends Nodes> = {
  [K in keyof TNodes]?: NodePatch<TNodes[K]>;
};

export type NormalizedNode<TNode extends NodeDefinition> =
  TNode extends Node ? TNode :
  TNode extends NodeDefinitions ? Form<NormalizedNodes<TNode>> : Node;

export type NormalizedNodes<TNodes extends NodeDefinitions> = {
  [K in keyof TNodes]: NormalizedNode<TNodes[K]>;
};

export type FormApi<TNodes extends Nodes> = {
  value: Signal<FormValue<TNodes>>;
  set(value: FormSet<TNodes>): void;
  patch(value: FormPatch<TNodes>): void;
  reset(...args: [] | [value: FormSet<TNodes>]): void;
  validators: Signal<Validators<FormValue<TNodes>>>;
  setValidators(validators: Validators<FormValue<TNodes>>): void;
  errors: Signal<ValidationErrors | null>;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  touched: Signal<boolean>;
  untouched: Signal<boolean>;
  markAsTouched(): void;
  markAsUntouched(): void;
  dirty: Signal<boolean>;
  pristine: Signal<boolean>;
  markAsDirty(): void;
  markAsPristine(): void;
  disabled: Signal<boolean>;
  enabled: Signal<boolean>;
  disable(): void;
  enable(): void;
  readonly: Signal<boolean>;
  writable: Signal<boolean>;
  markAsReadonly(): void;
  markAsWritable(): void;
  hidden: Signal<boolean>;
  visible: Signal<boolean>;
  hide(): void;
  show(): void;
};

export type Form<TNodes extends Nodes> =
  & { (): FormValue<TNodes>; api: FormApi<TNodes> }
  & TNodes
  & HiddenFunctionMembers<keyof TNodes>;

export const form = <TDefinitions extends NodeDefinitions & { api?: never }>(
  definitions: TDefinitions,
  validators?: Validators<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
  options?: FormOptions,
): Form<NormalizedNodes<TDefinitions>> => {
  type TNodes = NormalizedNodes<TDefinitions>;
  const controls = Object.fromEntries(
    Object.entries(definitions).map(([key, definition]) => [
      key,
      isNode(definition) ? definition : form(definition),
    ]),
  ) as TNodes;
  const controlKeys = () => Object.keys(controls) as (keyof TNodes)[];
  const formSelfDisabled = signal(options?.disabled ?? false);
  const formParent = signal<NodeApi | null>(null);
  const formDisabled = computed(() => formSelfDisabled() || formParent()?.disabled() === true);
  const formSelfReadonly = signal(options?.readonly ?? false);
  const formReadonly = computed(() => formSelfReadonly() || formParent()?.readonly() === true);
  const formSelfHidden = signal(options?.hidden ?? false);
  const formHidden = computed(() => formSelfHidden() || formParent()?.hidden() === true);
  const formNonInteractive = computed(() => formHidden() || formDisabled() || formReadonly());
  const formValue = computed(() => {
    const value = {} as FormValue<TNodes>;
    controlKeys().forEach((key) => { value[key] = controls[key]!(); });
    return value;
  });
  const formValidators = signal<Validators<FormValue<TNodes>>>(validators ?? []);
  const formErrors = computed(() => formNonInteractive()
    ? null
    : runValidators(formValue(), formValidators()));
  const formValid = computed(() =>
    formNonInteractive() || (
      formErrors() === null && controlKeys().every((key) => controls[key]!.api.valid())
    ),
  );
  const formTouched = computed(() =>
    !formNonInteractive() && controlKeys().some((key) => controls[key]!.api.touched()),
  );
  const formDirty = computed(() =>
    !formNonInteractive() && controlKeys().some((key) => controls[key]!.api.dirty()),
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
      const control = controls[key] as Node | undefined;
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
    disable: () => formSelfDisabled.set(true),
    enable: () => formSelfDisabled.set(false),
    readonly: formReadonly,
    writable: computed(() => !formReadonly()),
    markAsReadonly: () => formSelfReadonly.set(true),
    markAsWritable: () => formSelfReadonly.set(false),
    hidden: formHidden,
    visible: computed(() => !formHidden()),
    hide: () => formSelfHidden.set(true),
    show: () => formSelfHidden.set(false),
  };
  const internalApi = {
    ...api,
    _setParent: (parent: NodeApi | null) => formParent.set(parent),
  };
  controlKeys().forEach((key) => (controls[key] as Node).api._setParent?.(internalApi));
  const formNode = Object.defineProperties(
    () => formValue(),
    Object.getOwnPropertyDescriptors({ ...controls, api: internalApi }),
  );
  return markAsNode(formNode) as Form<TNodes>;
};
