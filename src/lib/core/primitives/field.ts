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
import { findFirstControlBindingInDom } from '../utils/node-control-binding';
import { createAsyncValidation } from '../validation/create-async-validation';
import { readStateSource, getInitialMutableState } from '../utils/read-state-source';
import { isValidatorSource, normalizeValidatorSource } from '../validation/validator-source';
import { createReactiveWatch, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import type { ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';
import type { ControlDebounce, InternalNode, MarkAsTouchedOptions, Node, NodeControlBinding } from '../types/node.type';
import { notifyExternalValidationReset, readExternalValidationErrors } from '../validation/external-validation-errors';
import { createDisabledReason, getInitialDisabledState, readConfiguredDisabledState, type DisabledState } from '../utils/disabled-reasons';
import { MAX_DATE_METADATA, MAX_LENGTH_METADATA, MAX_METADATA, MIN_DATE_METADATA, MIN_LENGTH_METADATA, MIN_METADATA, PATTERN_METADATA } from '../validation/constraint-metadata';

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
  const fieldControlBindings = new Set<NodeControlBinding>();
  const fieldContext = markAsFieldContext({ value: fieldValue.asReadonly() });
  const fieldValidators = signal<Validators<TValue>>(validators);
  const fieldTouched = signal(false);
  const fieldDirty = signal(false);
  const fieldSelfDisabled = signal<DisabledState>(getInitialDisabledState(resolvedOptions?.disabled));
  const fieldParent = signal<Node | null>(null);
  const fieldKeyInParent = signal<string | number | null>(null);
  const fieldControlDebounce = computed(() =>
    resolvedOptions?.debounce
    ?? (fieldParent() as InternalNode | null)?.$api._controlDebounce(),
  );
  const fieldPath = computed<readonly string[]>(() => {
    const parent = fieldParent();
    const key = fieldKeyInParent();
    return parent && key !== null ? [...parent.$api.path(), String(key)] : [];
  });
  let fieldNode!: Field<TValue>;
  const fieldOwnDisabledReason = computed(() => createDisabledReason(fieldSelfDisabled(), fieldNode), { equal: shallowEqual });
  const fieldConfiguredDisabledReason = computed(
    () => createDisabledReason(readConfiguredDisabledState(resolvedOptions?.disabled), fieldNode),
    { equal: shallowEqual },
  );
  const fieldDisabledReasons = computed(() => [
    ...(fieldParent()?.$api.disabledReasons() ?? []),
    ...[fieldOwnDisabledReason(), fieldConfiguredDisabledReason()].filter((reason) => reason !== undefined),
  ], { equal: shallowEqual });
  const fieldDisabled = computed(() => fieldDisabledReasons().length > 0);
  const fieldSelfReadonly = signal(getInitialMutableState(resolvedOptions?.readonly));
  const fieldReadonly = computed(() =>
    fieldSelfReadonly() || readStateSource(resolvedOptions?.readonly) || fieldParent()?.$api.readonly() === true,
  );
  const fieldSelfHidden = signal(getInitialMutableState(resolvedOptions?.hidden));
  const fieldHidden = computed(() =>
    fieldSelfHidden() || readStateSource(resolvedOptions?.hidden) || fieldParent()?.$api.hidden() === true,
  );
  const fieldNonInteractive = computed(() => fieldHidden() || fieldDisabled() || fieldReadonly());
  const emptySyncMetadata = new Map();
  const fieldForm = computed(() => fieldParent()?.$api.form() ?? null);
  const fieldSyncValidation = computed(() => fieldNonInteractive()
    ? { errors: [], metadata: emptySyncMetadata }
    : runSyncValidators(fieldContext, fieldValidators(), fieldNode));
  const fieldSyncErrors = computed(() => fieldSyncValidation().errors);
  const fieldMetadata = createNodeMetadata(fieldValidators, computed(() => fieldSyncValidation().metadata));
  const fieldMin = computed(() =>
    readMetadata(fieldMetadata(), MIN_DATE_METADATA)
    ?? readMetadata(fieldMetadata(), MIN_METADATA)
    ?? null,
  ) as FieldApi<TValue>['min'];
  const fieldMax = computed(() =>
    readMetadata(fieldMetadata(), MAX_DATE_METADATA)
    ?? readMetadata(fieldMetadata(), MAX_METADATA)
    ?? null,
  ) as FieldApi<TValue>['max'];
  const asyncValidation = createAsyncValidation(
    fieldContext,
    fieldValidators,
    fieldSyncErrors,
    () => fieldNode,
    () => !fieldNonInteractive(),
  );
  const fieldControlErrors = computed(() => fieldNonInteractive()
    ? []
    : readExternalValidationErrors(fieldNode));
  const fieldErrors = computed(() => [...fieldSyncErrors(), ...asyncValidation.errors(), ...fieldControlErrors()]);
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
    controller: null as AbortController | null,
    strategy: undefined as ControlDebounce | undefined,
    cancel: () => {
      if (controlDebounce.timer !== null) clearTimeout(controlDebounce.timer);
      controlDebounce.controller?.abort();
      controlDebounce.timer = null;
      controlDebounce.controller = null;
      controlDebounce.strategy = undefined;
      fieldDebouncing.set(false);
    },
    commit: () => {
      controlDebounce.cancel();
      fieldValue.set(fieldControlValue());
    },
    resolve: (controller: AbortController) => {
      if (controlDebounce.controller === controller && !controller.signal.aborted) controlDebounce.commit();
    },
    reject: (controller: AbortController) => {
      if (controlDebounce.controller === controller) controlDebounce.cancel();
    },
  };
  const controlDebounceRef = new WeakRef(controlDebounce);
  const getControlBindingForFocus = () => findFirstControlBindingInDom(fieldControlBindings);
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
    if (Object.is(next, fieldValue()) || (typeof debounce === 'number' && (!Number.isFinite(debounce) || debounce <= 0))) {
      fieldValue.set(next);
      return;
    }
    fieldDebouncing.set(true);
    controlDebounce.strategy = debounce;
    if (debounce === 'blur') return;
    if (typeof debounce === 'function') {
      const controller = new AbortController();
      controlDebounce.controller = controller;
      let completion: void | PromiseLike<void>;
      try {
        completion = debounce(controller.signal);
      } catch (error) {
        controlDebounce.cancel();
        throw error;
      }
      if (completion === undefined) {
        controlDebounce.commit();
        return;
      }
      Promise.resolve(completion).then(
        () => controlDebounceRef.deref()?.resolve(controller),
        () => controlDebounceRef.deref()?.reject(controller),
      );
      return;
    }
    controlDebounce.timer = setTimeout(() => controlDebounceRef.deref()?.commit(), debounce);
  };
  const reset = (...args: [] | [value: TValue]) => {
    controlDebounce.cancel();
    if (args.length === 1) fieldValue.set(args[0]);
    fieldControlValue.set(fieldValue());
    fieldTouched.set(false);
    fieldDirty.set(false);
    notifyExternalValidationReset(fieldNode);
  };
  const members = {
    form: fieldForm,
    parent: fieldParent.asReadonly(),
    path: fieldPath,
    keyInParent: fieldKeyInParent.asReadonly(),
    value: fieldValue.asReadonly(),
    controlValue: fieldControlValue.asReadonly(),
    set,
    update: (updater: (value: TValue) => TValue) => untracked(() => set(updater(fieldValue()))),
    setControlValue,
    debouncing: fieldDebouncing.asReadonly(),
    flush: controlDebounce.commit,
    focus: (options?: FocusOptions) => getControlBindingForFocus()?.focus(options),
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
    min: fieldMin,
    max: fieldMax,
    minLength: computed(() => readMetadata(fieldMetadata(), MIN_LENGTH_METADATA) ?? null),
    maxLength: computed(() => readMetadata(fieldMetadata(), MAX_LENGTH_METADATA) ?? null),
    pattern: computed(() => readMetadata(fieldMetadata(), PATTERN_METADATA)),
    required: computed(() =>
      readMetadata(fieldMetadata(), REQUIRED_METADATA) ||
      fieldErrors().some((error) => error.kind === 'required'),
    ),
    pending: computed(() => !fieldNonInteractive() && asyncValidation.pending()),
    submitting: computed(() => fieldParent()?.$api.submitting() === true),
    validationStatus: fieldValidationStatus,
    touched: computed(() => !fieldNonInteractive() && fieldTouched()),
    untouched: computed(() => fieldNonInteractive() || !fieldTouched()),
    markAsTouched: (_options?: MarkAsTouchedOptions) => {
      if (fieldNonInteractive()) return;
      fieldTouched.set(true);
      controlDebounce.commit();
    },
    markAsUntouched: () => fieldTouched.set(false),
    dirty: computed(() => !fieldNonInteractive() && fieldDirty()),
    pristine: computed(() => fieldNonInteractive() || !fieldDirty()),
    markAsDirty: () => fieldDirty.set(true),
    markAsPristine: () => fieldDirty.set(false),
    disabled: fieldDisabled,
    disabledReasons: fieldDisabledReasons,
    enabled: computed(() => !fieldDisabled()),
    disable: (message?: string) => fieldSelfDisabled.set(message ?? true),
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
    _controlValue: fieldControlValue.asReadonly(),
    _setControlValue: setControlValue,
    _flushControlValueOnBlur: () => {
      if (controlDebounce.strategy === 'blur') controlDebounce.commit();
    },
    _clone: () => recreateField(value, validatorSource, cloneOptions),
    _setParent: (parent: Node | null, key?: string) => {
      fieldParent.set(parent);
      fieldKeyInParent.set(parent ? key ?? null : null);
    },
    _registerControlBinding: (binding: NodeControlBinding) => {
      fieldControlBindings.add(binding);
      return () => { fieldControlBindings.delete(binding); };
    },
    _getControlBindingForFocus: getControlBindingForFocus,
  };
  fieldNode = Object.assign(
    () => fieldValue(),
    members,
    { api: internalApi, $api: internalApi },
  ) as unknown as Field<TValue>;
  markAsNode(fieldNode);
  ensureAsyncValidationWatch();
  return fieldNode;
}
