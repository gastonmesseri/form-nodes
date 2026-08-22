import { computed, signal, type Injector, type Signal } from '@angular/core';

import type { Field } from './field';
import { isNode, markAsNode } from '../utils/node-marker';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { markAsFieldContext } from '../utils/field-context-marker';
import { runSyncValidators } from '../validation/run-sync-validators';
import { isRequiredValidator } from '../utils/required-validator-marker';
import { createAsyncValidation } from '../validation/create-async-validation';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import { readStateSource, getInitialMutableState } from '../utils/read-state-source';
import { isValidatorSource, normalizeValidatorSource } from '../validation/validator-source';
import { createReactiveWatch, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import type { ValidationError, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';
import type { InternalNode, Node, NodeDefinition, NodeDefinitions, NodePatch, NodeSet, Nodes, NodeValue, RootNode } from '../types/node.type';

export type FormOptions<TValue = any> = {
  /** Synchronous and explicitly marked asynchronous validators applied to the aggregated form value. */
  readonly validators?: ValidatorSource<TValue>;
  /** Optional injector that owns the asynchronous validation watcher lifecycle. */
  readonly injector?: Injector;
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

export type FormRoot<TNodes extends Nodes, TParent extends Node> = Node extends TParent
  ? Form<TNodes, TParent>
  : RootNode<TParent>;

export type FormApi<TNodes extends Nodes, TParent extends Node = Node> = {
  readonly children: FormChildren<TNodes, TParent>;
  form: Signal<FormRoot<TNodes, TParent>>;
  parent: Signal<TParent | null>;
  path: Signal<readonly string[]>;
  value: Signal<FormValue<TNodes>>;
  set(value: FormSet<TNodes>): void;
  patch(value: FormPatch<TNodes>): void;
  reset(...args: [] | [value: FormSet<TNodes>]): void;
  validators: Signal<Validators<FormValue<TNodes>>>;
  setValidators(validators: ValidatorSource<FormValue<TNodes>>): void;
  errors: Signal<readonly ValidationError.WithTargetNode<Form<TNodes, TParent>>[]>;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<Form<TNodes, TParent>> & { readonly kind: TKind }) | undefined;
  required: Signal<boolean>;
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

export type NodeWithParent<TNode extends Node, TParent extends Node> =
  TNode extends Field<infer TValue, Node> ? Field<TValue, TParent> :
  TNode extends Form<infer TNodes, Node> ? Form<TNodes, TParent> : TNode;

export type FormChildren<TNodes extends Nodes, TParent extends Node> = {
  readonly [K in keyof TNodes]: NodeWithParent<TNodes[K], Form<TNodes, TParent>>;
};

export type Form<TNodes extends Nodes, TParent extends Node = Node> =
  & { (): FormValue<TNodes>; api: FormApi<TNodes, TParent> }
  & FormChildren<TNodes, TParent>
  & Omit<FormApi<TNodes, TParent>, keyof TNodes>
  & HiddenFunctionMembers<keyof TNodes | keyof FormApi<TNodes, TParent>>;

export function form<TDefinitions extends NodeDefinitions & { api?: never }>(
  definitions: TDefinitions,
  options?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
): Form<NormalizedNodes<TDefinitions>>;
export function form<TDefinitions extends NodeDefinitions & { api?: never }>(
  definitions: TDefinitions,
  validators?: ValidatorSource<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
  options?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
): Form<NormalizedNodes<TDefinitions>>;
export function form<TDefinitions extends NodeDefinitions & { api?: never }>(
  definitions: TDefinitions,
  validatorsOrOptions?: ValidatorSource<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>> | FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
  separateOptions?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
): Form<NormalizedNodes<TDefinitions>> {
  type TNodes = NormalizedNodes<TDefinitions>;
  type TValue = FormValue<TNodes>;
  const resolvedOptions = isValidatorSource<TValue>(validatorsOrOptions) || validatorsOrOptions === undefined
    ? separateOptions
    : validatorsOrOptions;
  const validatorSource = isValidatorSource<TValue>(validatorsOrOptions)
    ? validatorsOrOptions
    : resolvedOptions?.validators ?? [];
  const validators = normalizeValidatorSource(validatorSource);
  const controls = Object.fromEntries(
    Object.entries(definitions).map(([key, definition]) => [
      key,
      isNode(definition) ? definition : form(definition),
    ]),
  ) as TNodes;
  const controlKeys = () => Object.keys(controls) as (keyof TNodes)[];
  const formSelfDisabled = signal(getInitialMutableState(resolvedOptions?.disabled));
  const formParent = signal<Node | null>(null);
  const formKeyInParent = signal<string | null>(null);
  const formPath = computed<readonly string[]>(() => {
    const parent = formParent();
    const key = formKeyInParent();
    return parent && key !== null ? [...parent.api.path(), key] : [];
  });
  const formDisabled = computed(() =>
    formSelfDisabled() || readStateSource(resolvedOptions?.disabled) || formParent()?.api.disabled() === true,
  );
  const formSelfReadonly = signal(getInitialMutableState(resolvedOptions?.readonly));
  const formReadonly = computed(() =>
    formSelfReadonly() || readStateSource(resolvedOptions?.readonly) || formParent()?.api.readonly() === true,
  );
  const formSelfHidden = signal(getInitialMutableState(resolvedOptions?.hidden));
  const formHidden = computed(() =>
    formSelfHidden() || readStateSource(resolvedOptions?.hidden) || formParent()?.api.hidden() === true,
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
  const rootForm = computed(() => formParent()?.api.form() ?? formNode) as Signal<Form<TNodes>>;
  const formSyncValidation = computed(() => formNonInteractive()
    ? { errors: [], required: false }
    : runSyncValidators(formContext, formValidators(), formNode));
  const formSyncErrors = computed(() => formSyncValidation().errors);
  const asyncValidation = createAsyncValidation(
    formContext,
    formValidators,
    formSyncErrors,
    () => formNode,
    () => !formNonInteractive(),
  );
  const formErrors = computed(() => [...formSyncErrors(), ...asyncValidation.errors()]);
  const getError = <TKind extends string>(kind: TKind) =>
    formErrors().find((error): error is typeof error & { readonly kind: TKind } => error.kind === kind);
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
  let asyncValidationWatchTarget: ReactiveWatchTarget | null = null;
  const ensureAsyncValidationWatch = () => {
    if (asyncValidationWatchTarget || !formValidators().some(isAsyncValidator)) return;
    asyncValidationWatchTarget = { run: asyncValidation.validate, cleanup: asyncValidation.cancel, destroy: asyncValidation.destroy };
    createReactiveWatch(asyncValidationWatchTarget, resolvedOptions?.injector);
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
    children: controls as FormChildren<TNodes, Node>,
    form: rootForm,
    parent: formParent.asReadonly(),
    path: formPath,
    value: formValue,
    set,
    patch,
    reset,
    validators: formValidators.asReadonly(),
    setValidators: (next) => {
      formValidators.set(normalizeValidatorSource(next));
      ensureAsyncValidationWatch();
    },
    errors: formErrors,
    valid: computed(() => formValidationStatus() === 'valid'),
    invalid: computed(() => formValidationStatus() === 'invalid'),
    getError,
    required: computed(() =>
      formValidators().some(isRequiredValidator)
      || formSyncValidation().required
      || formErrors().some((error) => error.kind === 'required')
    ),
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
    _setParent: (parent: Node | null, key?: string) => {
      formParent.set(parent);
      formKeyInParent.set(parent ? key ?? null : null);
    },
  };
  formNode = Object.defineProperties(
    () => formValue(),
    Object.getOwnPropertyDescriptors({ ...api, ...controls, api: internalApi }),
  ) as Form<TNodes>;
  controlKeys().forEach((key) => (controls[key] as InternalNode).api._setParent(formNode, String(key)));
  markAsNode(formNode);
  ensureAsyncValidationWatch();
  return formNode;
}
