import { computed, signal, type Signal } from '@angular/core';

import { isNode, markAsNode } from '../utils/node-marker';
import { isValidators } from '../validation/is-validators';
import { markAsFieldContext } from '../utils/field-context-marker';
import { runSyncValidators } from '../validation/run-sync-validators';
import { createAsyncValidation } from '../validation/create-async-validation';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import { readStateSource, getInitialMutableState } from '../utils/read-state-source';
import type { ValidationError, ValidationStatus, Validators } from '../validation/validation.type';
import type { Node, NodeApi, NodeDefinition, NodeDefinitions, NodePatch, NodeSet, Nodes, NodeValue } from '../types/node.type';

export type FormOptions<TValue = any> = {
  /** Synchronous and explicitly marked asynchronous validators applied to the aggregated form value. */
  readonly validators?: Validators<TValue>;
  /** Initial hidden state or a Signal, computed Signal, or function evaluated reactively. */
  readonly hidden?: boolean | (() => boolean);
  /** Initial disabled state or a Signal, computed Signal, or function evaluated reactively. */
  readonly disabled?: boolean | (() => boolean);
  /** Initial readonly state or a Signal, computed Signal, or function evaluated reactively. */
  readonly readonly?: boolean | (() => boolean);
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
  errors: Signal<readonly ValidationError.WithTargetNode<Form<TNodes>>[]>;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  pending: Signal<boolean>;
  validationStatus: Signal<ValidationStatus>;
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

export function form<TDefinitions extends NodeDefinitions & { api?: never }>(
  definitions: TDefinitions,
  options?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
): Form<NormalizedNodes<TDefinitions>>;
export function form<TDefinitions extends NodeDefinitions & { api?: never }>(
  definitions: TDefinitions,
  validators?: Validators<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
  options?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
): Form<NormalizedNodes<TDefinitions>>;
export function form<TDefinitions extends NodeDefinitions & { api?: never }>(
  definitions: TDefinitions,
  validatorsOrOptions?: Validators<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>> | FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
  separateOptions?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
): Form<NormalizedNodes<TDefinitions>> {
  type TNodes = NormalizedNodes<TDefinitions>;
  type TValue = FormValue<TNodes>;
  const resolvedOptions = isValidators<TValue>(validatorsOrOptions) || validatorsOrOptions === undefined
    ? separateOptions
    : validatorsOrOptions;
  const validators = isValidators<TValue>(validatorsOrOptions)
    ? validatorsOrOptions
    : resolvedOptions?.validators ?? [];
  const controls = Object.fromEntries(
    Object.entries(definitions).map(([key, definition]) => [
      key,
      isNode(definition) ? definition : form(definition),
    ]),
  ) as TNodes;
  const controlKeys = () => Object.keys(controls) as (keyof TNodes)[];
  const formSelfDisabled = signal(getInitialMutableState(resolvedOptions?.disabled));
  const formParent = signal<NodeApi | null>(null);
  const formDisabled = computed(() =>
    formSelfDisabled() || readStateSource(resolvedOptions?.disabled) || formParent()?.disabled() === true,
  );
  const formSelfReadonly = signal(getInitialMutableState(resolvedOptions?.readonly));
  const formReadonly = computed(() =>
    formSelfReadonly() || readStateSource(resolvedOptions?.readonly) || formParent()?.readonly() === true,
  );
  const formSelfHidden = signal(getInitialMutableState(resolvedOptions?.hidden));
  const formHidden = computed(() =>
    formSelfHidden() || readStateSource(resolvedOptions?.hidden) || formParent()?.hidden() === true,
  );
  const formNonInteractive = computed(() => formHidden() || formDisabled() || formReadonly());
  const formValue = computed(() => {
    const value = {} as FormValue<TNodes>;
    controlKeys().forEach((key) => { value[key] = controls[key]!(); });
    return value;
  });
  const formContext = markAsFieldContext({ value: formValue });
  const formValidators = signal<Validators<FormValue<TNodes>>>(validators);
  let formNode!: Form<TNodes>;
  const formSyncErrors = computed(() => formNonInteractive()
    ? []
    : runSyncValidators(formContext, formValidators(), formNode));
  const asyncValidation = createAsyncValidation(
    formContext,
    formValidators,
    formSyncErrors,
    () => formNode,
    () => !formNonInteractive(),
  );
  const formErrors = computed(() => [...formSyncErrors(), ...asyncValidation.errors()]);
  const formPending = computed(() =>
    !formNonInteractive() && (
      asyncValidation.pending() || controlKeys().some((key) => controls[key]!.api.pending())
    ),
  );
  const formValidationStatus = computed<ValidationStatus>(() => {
    if (formNonInteractive()) return 'valid';
    if (formErrors().length > 0 || controlKeys().some((key) => controls[key]!.api.invalid())) return 'invalid';
    if (formPending()) return 'unknown';
    return 'valid';
  });
  const revalidateAsyncValidators = () => asyncValidation.validate();
  const notifyValueChange = () => {
    revalidateAsyncValidators();
    formParent()?._notifyValueChange?.();
  };
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
    setValidators: (next) => { formValidators.set(next); revalidateAsyncValidators(); },
    errors: formErrors,
    valid: computed(() => formValidationStatus() === 'valid'),
    invalid: computed(() => formValidationStatus() === 'invalid'),
    pending: formPending,
    validationStatus: formValidationStatus,
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
    disable: () => { formSelfDisabled.set(true); revalidateAsyncValidators(); controlKeys().forEach((key) => (controls[key] as Node).api._revalidateAsyncValidators?.()); },
    enable: () => { formSelfDisabled.set(false); revalidateAsyncValidators(); controlKeys().forEach((key) => (controls[key] as Node).api._revalidateAsyncValidators?.()); },
    readonly: formReadonly,
    writable: computed(() => !formReadonly()),
    markAsReadonly: () => { formSelfReadonly.set(true); revalidateAsyncValidators(); controlKeys().forEach((key) => (controls[key] as Node).api._revalidateAsyncValidators?.()); },
    markAsWritable: () => { formSelfReadonly.set(false); revalidateAsyncValidators(); controlKeys().forEach((key) => (controls[key] as Node).api._revalidateAsyncValidators?.()); },
    hidden: formHidden,
    visible: computed(() => !formHidden()),
    hide: () => { formSelfHidden.set(true); revalidateAsyncValidators(); controlKeys().forEach((key) => (controls[key] as Node).api._revalidateAsyncValidators?.()); },
    show: () => { formSelfHidden.set(false); revalidateAsyncValidators(); controlKeys().forEach((key) => (controls[key] as Node).api._revalidateAsyncValidators?.()); },
  };
  const internalApi = {
    ...api,
    _setParent: (parent: NodeApi | null) => { formParent.set(parent); revalidateAsyncValidators(); },
    _revalidateAsyncValidators: revalidateAsyncValidators,
    _notifyValueChange: notifyValueChange,
  };
  controlKeys().forEach((key) => (controls[key] as Node).api._setParent?.(internalApi));
  formNode = Object.defineProperties(
    () => formValue(),
    Object.getOwnPropertyDescriptors({ ...controls, api: internalApi }),
  ) as Form<TNodes>;
  markAsNode(formNode);
  revalidateAsyncValidators();
  return formNode;
}
