import { computed, signal, type Injector, type Signal } from '@angular/core';

import { markAsNode } from '../utils/node-marker';
import { isValidators } from '../validation/is-validators';
import type { InternalNodeApi } from '../types/node.type';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { markAsFieldContext } from '../utils/field-context-marker';
import { createReactiveWatch, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import { runSyncValidators } from '../validation/run-sync-validators';
import { createAsyncValidation } from '../validation/create-async-validation';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import { readStateSource, getInitialMutableState } from '../utils/read-state-source';
import type { ValidationError, ValidationStatus, Validators } from '../validation/validation.type';

export type FieldOptions<TValue = any> = {
  /** Synchronous and explicitly marked asynchronous validators applied to the field value. */
  readonly validators?: Validators<TValue>;
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

export type FieldApi<TValue> = {
  value: Signal<TValue>;
  set(value: TValue): void;
  patch(value: TValue): void;
  reset(...args: [] | [value: TValue]): void;
  validators: Signal<Validators<TValue>>;
  setValidators(validators: Validators<TValue>): void;
  errors: Signal<readonly ValidationError.WithTargetNode<Field<TValue>>[]>;
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

export type Field<TValue> =
  & { (): TValue; api: FieldApi<TValue> }
  & Omit<FieldApi<TValue>, 'patch'>
  & HiddenFunctionMembers;

type NullableFieldOptions<TValue> = FieldOptions<TValue | null> & { readonly nullable?: true };
type NonNullableFieldOptions<TValue> = FieldOptions<TValue> & { readonly nullable: false };

export function field<TValue extends {}>(
  value: TValue,
  options: NonNullableFieldOptions<NoInfer<TValue>>,
): Field<TValue>;
export function field<TValue extends {}>(
  value: TValue,
  validators: Validators<NoInfer<TValue>>,
  options: NonNullableFieldOptions<NoInfer<TValue>>,
): Field<TValue>;
export function field<TValue>(
  value?: TValue | null,
  options?: NullableFieldOptions<NoInfer<TValue>>,
): Field<TValue | null>;
export function field<TValue>(
  value?: TValue | null,
  validators?: Validators<NoInfer<TValue | null>>,
  options?: NullableFieldOptions<NoInfer<TValue>>,
): Field<TValue | null>;
export function field<TValue>(
  value: TValue = null as TValue,
  validatorsOrOptions?: Validators<NoInfer<TValue>> | FieldOptions<NoInfer<TValue>>,
  separateOptions?: FieldOptions<NoInfer<TValue>>,
): Field<TValue> {
  const resolvedOptions = isValidators<TValue>(validatorsOrOptions) || validatorsOrOptions === undefined
    ? separateOptions
    : validatorsOrOptions;
  const validators = isValidators<TValue>(validatorsOrOptions)
    ? validatorsOrOptions
    : resolvedOptions?.validators ?? [];
  const fieldValue = signal<TValue>(value!);
  const fieldContext = markAsFieldContext({ value: fieldValue.asReadonly() });
  const fieldValidators = signal<Validators<TValue>>(validators);
  const fieldTouched = signal(false);
  const fieldDirty = signal(false);
  const fieldSelfDisabled = signal(getInitialMutableState(resolvedOptions?.disabled));
  const fieldParent = signal<InternalNodeApi | null>(null);
  const fieldDisabled = computed(() =>
    fieldSelfDisabled() || readStateSource(resolvedOptions?.disabled) || fieldParent()?.disabled() === true,
  );
  const fieldSelfReadonly = signal(getInitialMutableState(resolvedOptions?.readonly));
  const fieldReadonly = computed(() =>
    fieldSelfReadonly() || readStateSource(resolvedOptions?.readonly) || fieldParent()?.readonly() === true,
  );
  const fieldSelfHidden = signal(getInitialMutableState(resolvedOptions?.hidden));
  const fieldHidden = computed(() =>
    fieldSelfHidden() || readStateSource(resolvedOptions?.hidden) || fieldParent()?.hidden() === true,
  );
  const fieldNonInteractive = computed(() => fieldHidden() || fieldDisabled() || fieldReadonly());
  let fieldNode!: Field<TValue>;
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
    asyncValidationWatchTarget = { run: asyncValidation.validate, cleanup: asyncValidation.cancel };
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
    value: fieldValue.asReadonly(),
    set,
    reset,
    validators: fieldValidators.asReadonly(),
    setValidators: (next: Validators<TValue>) => {
      fieldValidators.set(next);
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
    _setParent: (parent: InternalNodeApi | null) => fieldParent.set(parent),
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
