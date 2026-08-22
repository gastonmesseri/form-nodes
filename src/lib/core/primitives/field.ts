import { computed, signal, type Injector, type Signal } from '@angular/core';

import { markAsNode } from '../utils/node-marker';
import type { Node, RootNode } from '../types/node.type';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { markAsFieldContext } from '../utils/field-context-marker';
import { runSyncValidators } from '../validation/run-sync-validators';
import { createAsyncValidation } from '../validation/create-async-validation';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import { readStateSource, getInitialMutableState } from '../utils/read-state-source';
import { isValidatorSource, normalizeValidatorSource } from '../validation/validator-source';
import { createReactiveWatch, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import type { ValidationError, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';

export type FieldOptions<TValue = any> = {
  /** Synchronous and explicitly marked asynchronous validators applied to the field value. */
  readonly validators?: ValidatorSource<TValue>;
  /** Whether the field value includes null. Defaults to true and affects the public value type. */
  readonly nullable?: boolean;
  /** Optional injector that owns the asynchronous validation watcher lifecycle. */
  readonly injector?: Injector;
  /** Initial hidden state or a Signal, computed Signal, or function evaluated reactively. */
  readonly hidden?: boolean | (() => boolean);
  /** Initial disabled state or a Signal, computed Signal, or function evaluated reactively. */
  readonly disabled?: boolean | (() => boolean);
  /** Initial readonly state or a Signal, computed Signal, or function evaluated reactively. */
  readonly readonly?: boolean | (() => boolean);
};

export type FieldApi<TValue, TParent extends Node = Node> = {
  form: Signal<RootNode<TParent> | null>;
  parent: Signal<TParent | null>;
  path: Signal<readonly string[]>;
  value: Signal<TValue>;
  set(value: TValue): void;
  patch(value: TValue): void;
  reset(...args: [] | [value: TValue]): void;
  validators: Signal<Validators<TValue>>;
  setValidators(validators: ValidatorSource<TValue>): void;
  errors: Signal<readonly ValidationError.WithTargetNode<Field<TValue, TParent>>[]>;
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

export type Field<TValue, TParent extends Node = Node> =
  & { (): TValue; api: FieldApi<TValue, TParent> }
  & Omit<FieldApi<TValue, TParent>, 'patch'>
  & HiddenFunctionMembers;

type NullableFieldOptions<TValue> = FieldOptions<TValue | null> & { readonly nullable?: true };
type NonNullableFieldOptions<TValue> = FieldOptions<TValue> & { readonly nullable: false };
export function field<TValue extends {}>(
  value: TValue,
  options: NonNullableFieldOptions<NoInfer<TValue>>,
): Field<TValue>;
export function field<TValue extends {}>(
  value: TValue,
  validators: ValidatorSource<NoInfer<TValue>>,
  options: NonNullableFieldOptions<NoInfer<TValue>>,
): Field<TValue>;
export function field<TValue>(
  value?: TValue | null,
  options?: NullableFieldOptions<NoInfer<TValue>>,
): Field<TValue | null>;
export function field<TValue>(
  value?: TValue | null,
  validators?: ValidatorSource<NoInfer<TValue | null>>,
  options?: NullableFieldOptions<NoInfer<TValue>>,
): Field<TValue | null>;
export function field<TValue>(
  value: TValue = null as TValue,
  validatorsOrOptions?: ValidatorSource<NoInfer<TValue>> | FieldOptions<NoInfer<TValue>>,
  separateOptions?: FieldOptions<NoInfer<TValue>>,
): Field<TValue> {
  const resolvedOptions = isValidatorSource<TValue>(validatorsOrOptions) || validatorsOrOptions === undefined
    ? separateOptions
    : validatorsOrOptions;
  const validatorSource = isValidatorSource<TValue>(validatorsOrOptions)
    ? validatorsOrOptions
    : resolvedOptions?.validators ?? [];
  const validators = normalizeValidatorSource(validatorSource);
  const fieldValue = signal<TValue>(value!);
  const fieldContext = markAsFieldContext({ value: fieldValue.asReadonly() });
  const fieldValidators = signal<Validators<TValue>>(validators);
  const fieldTouched = signal(false);
  const fieldDirty = signal(false);
  const fieldSelfDisabled = signal(getInitialMutableState(resolvedOptions?.disabled));
  const fieldParent = signal<Node | null>(null);
  const fieldKeyInParent = signal<string | null>(null);
  const fieldPath = computed<readonly string[]>(() => {
    const parent = fieldParent();
    const key = fieldKeyInParent();
    return parent && key !== null ? [...parent.api.path(), key] : [];
  });
  const fieldDisabled = computed(() =>
    fieldSelfDisabled() || readStateSource(resolvedOptions?.disabled) || fieldParent()?.api.disabled() === true,
  );
  const fieldSelfReadonly = signal(getInitialMutableState(resolvedOptions?.readonly));
  const fieldReadonly = computed(() =>
    fieldSelfReadonly() || readStateSource(resolvedOptions?.readonly) || fieldParent()?.api.readonly() === true,
  );
  const fieldSelfHidden = signal(getInitialMutableState(resolvedOptions?.hidden));
  const fieldHidden = computed(() =>
    fieldSelfHidden() || readStateSource(resolvedOptions?.hidden) || fieldParent()?.api.hidden() === true,
  );
  const fieldNonInteractive = computed(() => fieldHidden() || fieldDisabled() || fieldReadonly());
  let fieldNode!: Field<TValue>;
  const fieldForm = computed(() => fieldParent()?.api.form() ?? null);
  const fieldSyncErrors = computed(() => fieldNonInteractive()
    ? []
    : runSyncValidators(fieldContext, fieldValidators(), fieldNode));
  const asyncValidation = createAsyncValidation(
    fieldContext,
    fieldValidators,
    fieldSyncErrors,
    () => fieldNode,
    () => !fieldNonInteractive(),
  );
  const fieldErrors = computed(() => [...fieldSyncErrors(), ...asyncValidation.errors()]);
  const fieldValidationStatus = computed<ValidationStatus>(() => {
    if (fieldNonInteractive()) return 'valid';
    if (fieldErrors().length > 0) return 'invalid';
    if (asyncValidation.pending()) return 'unknown';
    return 'valid';
  });
  let asyncValidationWatchTarget: ReactiveWatchTarget | null = null;
  const ensureAsyncValidationWatch = () => {
    if (asyncValidationWatchTarget || !fieldValidators().some(isAsyncValidator)) return;
    asyncValidationWatchTarget = { run: asyncValidation.validate, cleanup: asyncValidation.cancel, destroy: asyncValidation.destroy };
    createReactiveWatch(asyncValidationWatchTarget, resolvedOptions?.injector);
  };
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
    form: fieldForm,
    parent: fieldParent.asReadonly(),
    path: fieldPath,
    value: fieldValue.asReadonly(),
    set,
    reset,
    validators: fieldValidators.asReadonly(),
    setValidators: (next: ValidatorSource<TValue>) => {
      fieldValidators.set(normalizeValidatorSource(next));
      ensureAsyncValidationWatch();
    },
    errors: fieldErrors,
    valid: computed(() => fieldValidationStatus() === 'valid'),
    invalid: computed(() => fieldValidationStatus() === 'invalid'),
    pending: asyncValidation.pending,
    validationStatus: fieldValidationStatus,
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
    hidden: fieldHidden,
    visible: computed(() => !fieldHidden()),
    hide: () => fieldSelfHidden.set(true),
    show: () => fieldSelfHidden.set(false),
  };
  const api: FieldApi<TValue> = { ...members, patch: set };
  const internalApi = {
    ...api,
    _setParent: (parent: Node | null, key?: string) => {
      fieldParent.set(parent);
      fieldKeyInParent.set(parent ? key ?? null : null);
    },
  };
  fieldNode = Object.assign(
    () => fieldValue(),
    members,
    { api: internalApi },
  ) as unknown as Field<TValue>;
  markAsNode(fieldNode);
  ensureAsyncValidationWatch();
  return fieldNode;
}
