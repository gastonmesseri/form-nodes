import { computed, signal, untracked, type Signal } from '@angular/core';

import { isNotNil } from '../utils/is-nil';
import { markAsNode } from '../utils/node-marker';
import { readMetadata } from '../metadata/metadata';
import { shallowEqual } from '../utils/shallow-equal';
import { refreshNodeInjector, registerNodeInjector, watchNodeInjector } from '../utils/node-injector';
import { registerAngularField } from '../interop/angular-field';
import { computedFunction } from '../utils/computed-function';
import type { Field, FieldApi, FieldOptions } from './field.type';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { markAsFieldContext } from '../utils/field-context-marker';
import { runSyncValidators } from '../validation/run-sync-validators';
import { createValidatorContext } from '../validation/create-validator-context';
import { createNodeMetadata } from '../metadata/create-node-metadata';
import { REQUIRED_METADATA } from '../validation/validators/required';
import { findFirstControlBindingInDom } from '../utils/node-control-binding';
import { createAsyncValidation } from '../validation/create-async-validation';
import { registerNodeValidatorMessages } from '../validation/validator-messages';
import { readStateSource, getInitialMutableState } from '../utils/read-state-source';
import { isValidatorSource, normalizeValidatorSource } from '../validation/validator-source';
import { createReactiveWatch, type ReactiveWatchRef, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import type { ValidationStatus, ValidatorContext, ValidatorSource, Validators } from '../validation/validation.type';
import { notifyExternalValidationReset, readExternalValidationErrors } from '../validation/external-validation-errors';
import type { ControlDebounce, InternalNode, MarkAsTouchedOptions, Node, NodeControlBinding } from '../types/node.type';
import { createDisabledReason, getInitialDisabledState, readConfiguredDisabledState, type DisabledState } from '../utils/disabled-reasons';
import { MAX_DATE_METADATA, MAX_LENGTH_METADATA, MAX_METADATA, MIN_DATE_METADATA, MIN_LENGTH_METADATA, MIN_METADATA, PATTERN_METADATA } from '../validation/constraint-metadata';

export type { Field, FieldApi, FieldOptions } from './field.type';

type NullableFieldOptions<TValue> = FieldOptions<TValue | null>;
type NonNullableFieldOptions<TValue> = FieldOptions<TValue>;

/**
 * Creates a nullable field whose future value type is not yet known.
 *
 * ```ts
 * const value = field(null);
 *
 * value(); // null
 * ```
 *
 * Literal `null` and `undefined` initial values both use this safe inference. Use an explicit
 * generic such as `field<string>(null)` when the eventual value type is known.
 *
 * @param value Initial committed value.
 * @param options Field configuration.
 */
export function field(
  value: null,
  options?: NullableFieldOptions<unknown>,
): Field<unknown>;
/**
 * Creates a field inferred as `Field<unknown>` from `null`, with positional validators.
 *
 * ```ts
 * const name = field(null, [required]);
 * ```
 *
 * @param value Initial committed value.
 * @param validators Validators for the field value.
 * @param options Field configuration.
 */
export function field(
  value: null,
  validators: ValidatorSource<unknown>,
  options?: NullableFieldOptions<unknown>,
): Field<unknown>;
/**
 * Creates a nullable field whose future value type is not yet known from an `undefined` initial value.
 *
 * ```ts
 * const value = field(undefined);
 * ```
 *
 * Use an explicit generic such as `field<string>(undefined)` when the eventual value type is known.
 *
 * @param value Initial committed value. An explicit `undefined` is preserved.
 * @param options Field configuration.
 */
export function field(
  value: undefined,
  options?: NullableFieldOptions<unknown>,
): Field<unknown>;
/**
 * Creates a field inferred as `Field<unknown>` from `undefined`, with positional validators.
 *
 * ```ts
 * const name = field(undefined, [required]);
 * ```
 *
 * @param value Initial committed value. An explicit `undefined` is preserved.
 * @param validators Validators for the field value.
 * @param options Field configuration.
 */
export function field(
  value: undefined,
  validators: ValidatorSource<unknown>,
  options?: NullableFieldOptions<unknown>,
): Field<unknown>;
/** Creates a nullable field that preserves an explicitly typed `undefined` initial value. */
export function field<TValue>(
  value: undefined,
  options?: FieldOptions<NoInfer<TValue | null | undefined>>,
): Field<TValue | null | undefined>;
/** Creates a nullable field with validators that preserves an explicitly typed `undefined` initial value. */
export function field<TValue>(
  value: undefined,
  validators: ValidatorSource<NoInfer<TValue | null | undefined>>,
  options?: FieldOptions<NoInfer<TValue | null | undefined>>,
): Field<TValue | null | undefined>;
/**
 * Creates a nullable field from an initial value and optional configuration.
 *
 * ```ts
 * const name = field('Marco');
 *
 * name(); // 'Marco'
 * ```
 *
 * The inferred value type includes `null`. Omitting the value initializes the field to `null`.
 * Use `field.strict()` when the field must remain non-nullable.
 *
 * @param value Initial committed value.
 * @param options Field configuration.
 */
export function field<TValue>(
  value: TValue | null,
  options?: NullableFieldOptions<NoInfer<TValue>>,
): Field<TValue | null>;
export function field<TValue>(): Field<TValue | null>;
/**
 * Creates a nullable field from an initial value, positional validators, and optional configuration.
 *
 * ```ts
 * const name = field('', [required]);
 * ```
 *
 * @param value Initial committed value.
 * @param validators Validators for the field value.
 * @param options Field configuration.
 */
export function field<TValue>(
  value: TValue | null,
  validators?: ValidatorSource<NoInfer<TValue | null>>,
  options?: NullableFieldOptions<NoInfer<TValue>>,
): Field<TValue | null>;
export function field<TValue>(
  value?: TValue,
  validatorsOrOptions?: ValidatorSource<NoInfer<TValue>> | FieldOptions<NoInfer<TValue>>,
  separateOptions?: FieldOptions<NoInfer<TValue>>,
): Field<TValue> {
  const initialValue = (arguments.length === 0 ? null : value) as TValue;
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
  const fieldValue = signal<TValue>(initialValue);
  const fieldControlValue = signal<TValue>(initialValue);
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
  // eslint-disable-next-line prefer-const -- Assigned after self-referencing computed state has been declared.
  let fieldNode!: Field<TValue>;
  const fieldOwnDisabledReason = computed(() => createDisabledReason(fieldSelfDisabled(), fieldNode), { equal: shallowEqual });
  const fieldConfiguredDisabledReason = computed(
    () => createDisabledReason(readConfiguredDisabledState(resolvedOptions?.disabled), fieldNode),
    { equal: shallowEqual },
  );
  const fieldDisabledReasons = computed(() => [
    ...(fieldParent()?.$api.disabledReasons() ?? []),
    ...[fieldOwnDisabledReason(), fieldConfiguredDisabledReason()].filter(isNotNil),
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
  const fieldRoot = computed(() => fieldParent()?.$api.root() ?? fieldNode) as Signal<Field<TValue>>;
  const fieldSyncValidation = computed(() => fieldNonInteractive()
    ? { errors: [], metadata: emptySyncMetadata }
    : runSyncValidators(fieldContext, fieldValidators(), fieldNode));
  const fieldSyncErrors = computed(() => fieldSyncValidation().errors);
  const fieldMetadata = createNodeMetadata(
    fieldValidators,
    computed(() => fieldSyncValidation().metadata),
    () => createValidatorContext(fieldContext, fieldNode) as ValidatorContext<unknown>,
  );
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
    (kind: string) => fieldErrors().find(error => error.kind === kind),
    { equal: shallowEqual, max: 20 },
  ) as FieldApi<TValue>['getError'];
  const fieldValidationStatus = computed<ValidationStatus>(() => {
    if (fieldNonInteractive()) return 'valid';
    if (fieldErrors().length > 0) return 'invalid';
    if (asyncValidation.pending()) return 'unknown';
    return 'valid';
  });
  let asyncValidationWatchTarget: ReactiveWatchTarget | null = null;
  let asyncValidationWatchRef: ReactiveWatchRef | null = null;
  const ensureAsyncValidationWatch = () => {
    if (asyncValidationWatchTarget || !fieldValidators().some(isAsyncValidator)) return;
    asyncValidationWatchTarget = { run: asyncValidation.validate, cleanup: asyncValidation.cancel, destroy: asyncValidation.destroy };
    asyncValidationWatchRef = createReactiveWatch(asyncValidationWatchTarget, null);
    watchNodeInjector(fieldNode, injector => asyncValidationWatchRef?.setInjector(injector));
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
    fieldControlBindings.forEach(binding => binding.reset?.());
  };
  const members = {
    nodeType: () => 'field' as const,
    form: fieldForm,
    root: fieldRoot,
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
      readMetadata(fieldMetadata(), REQUIRED_METADATA)
      || fieldErrors().some(error => error.kind === 'required'),
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
    _nodeType: 'field' as const,
    _controlDebounce: fieldControlDebounce,
    _controlValue: fieldControlValue.asReadonly(),
    _setControlValue: setControlValue,
    _flushControlValueOnBlur: () => {
      if (controlDebounce.strategy === 'blur') controlDebounce.commit();
    },
    _clone: () => recreateField(initialValue, validatorSource, cloneOptions),
    _setParent: (parent: Node | null, key?: string) => {
      fieldParent.set(parent);
      fieldKeyInParent.set(parent ? key ?? null : null);
      refreshNodeInjector(fieldNode);
    },
    _refreshInjector: () => refreshNodeInjector(fieldNode),
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
  registerNodeInjector(fieldNode, resolvedOptions?.injector, resolvedOptions?.inheritInjector !== false, resolvedOptions?.adoptBindingInjector !== false);
  registerAngularField(fieldNode);
  registerNodeValidatorMessages(fieldNode, undefined, resolvedOptions?.injector);
  ensureAsyncValidationWatch();
  return fieldNode;
}

export namespace field {
  /**
   * Creates a field that excludes `null`, independently of the configured default.
   *
   * ```ts
   * const name = field.strict('Marco');
   *
   * name(); // 'Marco'
   * ```
   *
   * @param value Initial committed value.
   * @param options Field configuration.
   */
  export function strict<TValue extends {}>(value: TValue, options?: NonNullableFieldOptions<NoInfer<TValue>>): Field<TValue>;
  /**
   * Creates a non-nullable field with positional validators.
   *
   * ```ts
   * const name = field.strict('Marco', [required]);
   * ```
   *
   * @param value Initial committed value.
   * @param validators Validators for the field value.
   * @param options Field configuration.
   */
  export function strict<TValue extends {}>(value: TValue, validators: ValidatorSource<NoInfer<TValue>>, options?: NonNullableFieldOptions<NoInfer<TValue>>): Field<TValue>;
  export function strict<TValue extends {}>(
    value: TValue,
    validatorsOrOptions?: ValidatorSource<NoInfer<TValue>> | NonNullableFieldOptions<NoInfer<TValue>>,
    separateOptions?: NonNullableFieldOptions<NoInfer<TValue>>,
  ): Field<TValue> {
    const createField = field as unknown as (
      initialValue: TValue,
      initialValidatorsOrOptions?: ValidatorSource<TValue> | FieldOptions<TValue>,
      initialOptions?: FieldOptions<TValue>,
    ) => Field<TValue>;
    if (isValidatorSource<TValue>(validatorsOrOptions) || validatorsOrOptions === undefined) {
      return createField(value, validatorsOrOptions, separateOptions);
    }
    return createField(value, validatorsOrOptions);
  }

  /**
   * Creates a field that includes `null`, independently of the configured default.
   *
   * The package-level `field()` is already nullable by default, so `field<string>()` returns
   * `Field<string | null>`. Use `field.nullable()` to make that choice explicit or to override a
   * non-nullable `createFormPrimitives()` default.
   *
   * ```ts
   * const defaultName = field<string>();
   * const nickname = field.nullable('Marco');
   *
   * defaultName.set(null);
   * nickname.set(null);
   * ```
   *
   * @param value Initial committed value.
   * @param options Field configuration.
   */
  export function nullable(value: null | undefined, options?: NullableFieldOptions<unknown>): Field<unknown>;
  export function nullable<TValue>(value: undefined, options?: FieldOptions<NoInfer<TValue | null | undefined>>): Field<TValue | null | undefined>;
  export function nullable<TValue>(value: TValue | null, options?: NullableFieldOptions<NoInfer<TValue>>): Field<TValue | null>;
  export function nullable<TValue>(): Field<TValue | null>;
  /**
   * Creates a nullable field with positional validators.
   *
   * ```ts
   * const nickname = field.nullable('', [required]);
   * ```
   *
   * @param value Initial committed value.
   * @param validators Validators for the nullable field value.
   * @param options Field configuration.
   */
  export function nullable(value: null | undefined, validators: ValidatorSource<unknown>, options?: NullableFieldOptions<unknown>): Field<unknown>;
  export function nullable<TValue>(value: undefined, validators: ValidatorSource<NoInfer<TValue | null | undefined>>, options?: FieldOptions<NoInfer<TValue | null | undefined>>): Field<TValue | null | undefined>;
  export function nullable<TValue>(value: TValue | null, validators: ValidatorSource<NoInfer<TValue | null>>, options?: NullableFieldOptions<NoInfer<TValue>>): Field<TValue | null>;
  export function nullable<TValue>(
    value?: TValue | null,
    validatorsOrOptions?: ValidatorSource<NoInfer<TValue | null>> | NullableFieldOptions<NoInfer<TValue>>,
    separateOptions?: NullableFieldOptions<NoInfer<TValue>>,
  ): Field<TValue | null | undefined> {
    const initialValue = arguments.length === 0 ? null : value;
    const createField = field as unknown as (
      initialValue: TValue | null | undefined,
      initialValidatorsOrOptions?: ValidatorSource<TValue | null | undefined> | FieldOptions<TValue | null | undefined>,
      initialOptions?: FieldOptions<TValue | null | undefined>,
    ) => Field<TValue | null | undefined>;
    if (isValidatorSource<TValue | null | undefined>(validatorsOrOptions) || validatorsOrOptions === undefined) {
      return createField(
        initialValue,
        validatorsOrOptions as ValidatorSource<TValue | null | undefined> | undefined,
        separateOptions as FieldOptions<TValue | null | undefined> | undefined,
      );
    }
    return createField(initialValue, validatorsOrOptions as FieldOptions<TValue | null | undefined>);
  }
}
