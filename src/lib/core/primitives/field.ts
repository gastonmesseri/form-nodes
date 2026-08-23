import { computed, signal, untracked } from '@angular/core';

import { markAsNode } from '../utils/node-marker';
import { readMetadata } from '../metadata/metadata';
import { shallowEqual } from '../utils/shallow-equal';
import { computedFunction } from '../utils/computed-function';
import type { Field, FieldApi, FieldOptions } from './field.type';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { markAsFieldContext } from '../utils/field-context-marker';
import { runSyncValidators } from '../validation/run-sync-validators';
import { createNodeMetadata } from '../metadata/create-node-metadata';
import { REQUIRED_METADATA } from '../validation/validators/required';
import { createAsyncValidation } from '../validation/create-async-validation';
import type { InternalNode, MarkAsTouchedOptions, Node } from '../types/node.type';
import { readStateSource, getInitialMutableState } from '../utils/read-state-source';
import { isValidatorSource, normalizeValidatorSource } from '../validation/validator-source';
import { createReactiveWatch, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import type { ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';

export type { Field, FieldApi, FieldOptions } from './field.type';

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
  const cloneOptions = resolvedOptions === undefined ? undefined : { ...resolvedOptions };
  const recreateField = field as unknown as (
    initialValue: TValue,
    initialValidators: ValidatorSource<TValue>,
    initialOptions?: FieldOptions<TValue>,
  ) => Field<TValue>;
  const fieldValue = signal<TValue>(value!);
  const fieldControlValue = signal<TValue>(value!);
  const fieldDebouncing = signal(false);
  const fieldContext = markAsFieldContext({ value: fieldValue.asReadonly() });
  const fieldValidators = signal<Validators<TValue>>(validators);
  const fieldTouched = signal(false);
  const fieldDirty = signal(false);
  const fieldSelfDisabled = signal(getInitialMutableState(resolvedOptions?.disabled));
  const fieldParent = signal<Node | null>(null);
  const fieldKeyInParent = signal<string | null>(null);
  const fieldControlDebounce = computed(() =>
    resolvedOptions?.debounce
    ?? (fieldParent() as InternalNode | null)?.api._controlDebounce(),
  );
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
  const emptySyncMetadata = new Map();
  const fieldForm = computed(() => fieldParent()?.api.form() ?? null);
  const fieldSyncValidation = computed(() => fieldNonInteractive()
    ? { errors: [], metadata: emptySyncMetadata }
    : runSyncValidators(fieldContext, fieldValidators(), fieldNode));
  const fieldSyncErrors = computed(() => fieldSyncValidation().errors);
  const fieldMetadata = createNodeMetadata(fieldValidators, computed(() => fieldSyncValidation().metadata));
  const asyncValidation = createAsyncValidation(
    fieldContext,
    fieldValidators,
    fieldSyncErrors,
    () => fieldNode,
    () => !fieldNonInteractive(),
  );
  const fieldErrors = computed(() => [...fieldSyncErrors(), ...asyncValidation.errors()]);
  const getError = computedFunction(
    (kind: string) => fieldErrors().find((error) => error.kind === kind),
    { equal: shallowEqual, max: 20 },
  ) as FieldApi<TValue>['getError'];
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
  const controlDebounce = {
    timer: null as ReturnType<typeof setTimeout> | null,
    cancel: () => {
      if (controlDebounce.timer !== null) clearTimeout(controlDebounce.timer);
      controlDebounce.timer = null;
      fieldDebouncing.set(false);
    },
    commit: () => {
      controlDebounce.cancel();
      fieldValue.set(fieldControlValue());
    },
  };
  const controlDebounceRef = new WeakRef(controlDebounce);
  const set = (next: TValue) => {
    controlDebounce.cancel();
    fieldControlValue.set(next);
    fieldValue.set(next);
  };
  const setControlValue = (next: TValue) => {
    controlDebounce.cancel();
    fieldControlValue.set(next);
    fieldDirty.set(true);
    const debounce = fieldControlDebounce() ?? 0;
    if (!Number.isFinite(debounce) || debounce <= 0 || Object.is(next, fieldValue())) {
      fieldValue.set(next);
      return;
    }
    fieldDebouncing.set(true);
    controlDebounce.timer = setTimeout(() => controlDebounceRef.deref()?.commit(), debounce);
  };
  const reset = (...args: [] | [value: TValue]) => {
    controlDebounce.cancel();
    if (args.length === 1) fieldValue.set(args[0]);
    fieldControlValue.set(fieldValue());
    fieldTouched.set(false);
    fieldDirty.set(false);
  };
  const members = {
    form: fieldForm,
    parent: fieldParent.asReadonly(),
    path: fieldPath,
    value: fieldValue.asReadonly(),
    controlValue: fieldControlValue.asReadonly(),
    set,
    update: (updater: (value: TValue) => TValue) => untracked(() => set(updater(fieldValue()))),
    setControlValue,
    debouncing: fieldDebouncing.asReadonly(),
    flush: controlDebounce.commit,
    reset,
    validators: fieldValidators.asReadonly(),
    setValidators: (next: ValidatorSource<TValue>) => {
      fieldValidators.set(normalizeValidatorSource(next));
      ensureAsyncValidationWatch();
    },
    errors: fieldErrors,
    allErrors: fieldErrors,
    valid: computed(() => fieldValidationStatus() === 'valid'),
    invalid: computed(() => fieldValidationStatus() === 'invalid'),
    getError,
    required: computed(() =>
      readMetadata(fieldMetadata(), REQUIRED_METADATA) ||
      fieldErrors().some((error) => error.kind === 'required'),
    ),
    pending: asyncValidation.pending,
    validationStatus: fieldValidationStatus,
    touched: computed(() => !fieldNonInteractive() && fieldTouched()),
    untouched: computed(() => fieldNonInteractive() || !fieldTouched()),
    markAsTouched: (_options?: MarkAsTouchedOptions) => { if (!fieldNonInteractive()) fieldTouched.set(true); },
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
    _controlDebounce: fieldControlDebounce,
    _clone: () => recreateField(value, validatorSource, cloneOptions),
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
