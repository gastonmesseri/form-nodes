import { computed, signal, untracked } from '@angular/core';

import { isNotNil } from '../utils/is-nil';
import { markAsNode } from './utils/node-marker';
import { readMetadata } from '../metadata/metadata';
import { shallowEqual } from '../utils/shallow-equal';
import { computedFunction } from '../utils/computed-function';
import { registerAngularField } from '../interop/angular-field';
import type { Field, FieldApi, FieldOptions } from './field.type';
import { runSyncValidators } from '../validation/run-sync-validators';
import { createNodeMetadata } from '../metadata/create-node-metadata';
import { REQUIRED_METADATA } from '../validation/validators/required';
import { findFirstControlBindingInDom } from '../utils/node-control-binding';
import { isAsyncValidator } from '../validation/utils/async-validator-marker';
import { markAsFieldContext } from '../validation/utils/field-context-marker';
import { createAsyncValidation } from '../validation/create-async-validation';
import { normalizeValidatorSource } from '../validation/utils/validator-source';
import { registerNodeValidatorMessages } from '../validation/validator-messages';
import { readStateSource, getInitialMutableState } from './utils/read-state-source';
import { createValidatorContext } from '../validation/utils/create-validator-context';
import { refreshNodeInjector, registerNodeInjector, watchNodeInjector } from '../utils/node-injector';
import { createReactiveWatch, type ReactiveWatchRef, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import { notifyExternalValidationReset, readExternalValidationErrors } from '../validation/external-validation-errors';
import type { ControlDebounce, InternalNode, MarkAsTouchedOptions, Node, NodeControlBinding } from '../types/node.type';
import type { FieldContext, ValidationStatus, ValidatorContext, ValidatorSource, Validators } from '../validation/validation.type';
import { createDisabledReason, getInitialDisabledState, readConfiguredDisabledState, type DisabledState } from './utils/disabled-reasons';
import { MAX_DATE_METADATA, MAX_LENGTH_METADATA, MAX_METADATA, MIN_DATE_METADATA, MIN_LENGTH_METADATA, MIN_METADATA, PATTERN_METADATA } from '../validation/constraint-metadata';

export function createFieldNode<TValue>(
  initialValue: TValue,
  validatorSource: ValidatorSource<TValue, Field<TValue>>,
  options?: FieldOptions<TValue>,
): Field<TValue> {
  return new FieldNode<TValue>(initialValue, validatorSource, options).getNode();
}

/** Owns a field's state while exposing the existing callable node and API objects. */
export class FieldNode<TValue> {
  node: Field<TValue>;

  cloneOptions: FieldOptions<TValue> | undefined;

  stateRef = new WeakRef(this);

  controlBindings = new Set<NodeControlBinding>();

  debounceStrategy: ControlDebounce | undefined;

  debounceTimer: ReturnType<typeof setTimeout> | null = null;

  debounceController: AbortController | null = null;

  context: FieldContext<TValue>;

  emptySyncMetadata = new Map();

  metadata: ReturnType<typeof createNodeMetadata>;

  asyncValidation: ReturnType<typeof createAsyncValidation<TValue, Field<TValue>>>;

  asyncValidationWatchTarget: ReactiveWatchTarget | null = null;

  asyncValidationWatchRef: ReactiveWatchRef | null = null;

  parent = signal<Node | null>(null);

  keyInParent = signal<string | number | null>(null);

  value = signal(undefined as TValue);

  controlValue = signal(undefined as TValue);

  debouncing = signal(false);

  selfDisabled = signal<DisabledState>(false);

  selfReadonly = signal(false);

  selfHidden = signal(false);

  selfTouched = signal(false);

  selfDirty = signal(false);

  validators = signal<Validators<TValue>>([]);

  getError = computedFunction((kind: string) => {
    return this.errors().find(error => error?.kind === kind);
  }, { equal: shallowEqual, max: 20 }) as FieldApi<TValue>['getError'];

  path = computed((): readonly string[] => {
    const parent = this.parent();
    const key = this.keyInParent();
    return parent && key !== null ? [...parent.$api.path(), String(key)] : [];
  });

  form = computed(() => this.parent()?.$api.form() ?? null) as FieldApi<TValue>['form'];

  root = computed(() => this.parent()?.$api.root() ?? this.node) as FieldApi<TValue>['root'];

  controlDebounce = computed(() => {
    return this.options?.debounce
      ?? (this.parent() as InternalNode | null)?.$api._controlDebounce();
  });

  ownDisabledReason = computed(() => createDisabledReason(this.selfDisabled(), this.node), { equal: shallowEqual });

  configuredDisabledReason = computed(() => {
    return createDisabledReason(readConfiguredDisabledState(this.options?.disabled), this.node);
  }, { equal: shallowEqual });

  disabledReasons = computed(() => [
    ...(this.parent()?.$api.disabledReasons() ?? []),
    ...[this.ownDisabledReason(), this.configuredDisabledReason()].filter(isNotNil),
  ], { equal: shallowEqual });

  disabled = computed(() => this.disabledReasons().length > 0);

  enabled = computed(() => !this.disabled());

  readonly = computed(() => {
    return this.selfReadonly()
      || readStateSource(this.options?.readonly)
      || this.parent()?.$api.readonly() === true;
  });

  writable = computed(() => !this.readonly());

  hidden = computed(() => {
    return this.selfHidden()
      || readStateSource(this.options?.hidden)
      || this.parent()?.$api.hidden() === true;
  });

  visible = computed(() => !this.hidden());

  nonInteractive = computed(() => this.hidden() || this.disabled() || this.readonly());

  touched = computed(() => !this.nonInteractive() && this.selfTouched());

  untouched = computed(() => this.nonInteractive() || !this.selfTouched());

  dirty = computed(() => !this.nonInteractive() && this.selfDirty());

  pristine = computed(() => this.nonInteractive() || !this.selfDirty());

  submitting = computed(() => this.parent()?.$api.submitting() === true);

  syncValidation = computed(() => {
    return this.nonInteractive()
      ? { errors: [], metadata: this.emptySyncMetadata }
      : runSyncValidators(this.context, this.validators(), this.node);
  });

  syncErrors = computed(() => this.syncValidation().errors);

  controlErrors = computed(() => {
    return this.nonInteractive() ? [] : readExternalValidationErrors(this.node);
  });

  errors = computed(() => [
    ...this.syncErrors(),
    ...this.asyncValidation.errors(),
    ...this.controlErrors(),
  ]);

  validationStatus = computed<ValidationStatus>(() => {
    if (this.nonInteractive()) return 'valid';
    if (this.errors().length > 0) return 'invalid';
    if (this.asyncValidation.pending()) return 'unknown';
    return 'valid';
  });

  valid = computed(() => this.validationStatus() === 'valid');

  invalid = computed(() => this.validationStatus() === 'invalid');

  pending = computed(() => !this.nonInteractive() && this.asyncValidation.pending());

  required = computed(() => {
    return readMetadata(this.metadata(), REQUIRED_METADATA)
      || this.errors().some(error => error.kind === 'required');
  });

  min = computed(() => {
    return readMetadata(this.metadata(), MIN_DATE_METADATA)
      ?? readMetadata(this.metadata(), MIN_METADATA)
      ?? null;
  }) as FieldApi<TValue>['min'];

  max = computed(() => {
    return readMetadata(this.metadata(), MAX_DATE_METADATA)
      ?? readMetadata(this.metadata(), MAX_METADATA)
      ?? null;
  }) as FieldApi<TValue>['max'];

  minLength = computed(() => readMetadata(this.metadata(), MIN_LENGTH_METADATA) ?? null);

  maxLength = computed(() => readMetadata(this.metadata(), MAX_LENGTH_METADATA) ?? null);

  pattern = computed(() => readMetadata(this.metadata(), PATTERN_METADATA));

  constructor(
    public initialValue: TValue,
    public initialValidatorSource: ValidatorSource<TValue, Field<TValue>>,
    public options?: FieldOptions<TValue>,
  ) {
    this.cloneOptions = this.options === undefined ? undefined : { ...this.options };
    const { disabled, readonly, hidden } = this.options ?? {};
    const validators = normalizeValidatorSource(this.initialValidatorSource);

    // Seed all local state before creating the context, validation, or public node.
    untracked(() => {
      this.validators.set(validators);
      this.value.set(this.initialValue);
      this.controlValue.set(this.initialValue);
      this.selfDisabled.set(getInitialDisabledState(disabled));
      this.selfReadonly.set(getInitialMutableState(readonly));
      this.selfHidden.set(getInitialMutableState(hidden));
    });

    this.context = markAsFieldContext({ value: this.value.asReadonly() });

    this.metadata = createNodeMetadata(
      this.validators,
      computed(() => this.syncValidation().metadata),
      () => createValidatorContext(this.context, this.node) as ValidatorContext<unknown>,
    );

    this.asyncValidation = createAsyncValidation(
      this.context,
      this.validators,
      () => this.syncErrors(),
      () => this.node,
      () => !this.nonInteractive(),
    );

    this.node = this.createNode();
    markAsNode(this.node);
    registerNodeInjector(this.node, this.options?.injector, this.options?.inheritInjector !== false, this.options?.adoptBindingInjector !== false);
    registerAngularField(this.node);
    registerNodeValidatorMessages(this.node, undefined, this.options?.injector);

    untracked(() => this.ensureAsyncValidationWatch());
  }

  getNode() {
    return this.node;
  }

  set(next: TValue) {
    this.cancelControlDebounce();
    this.controlValue.set(next);
    this.value.set(next);
  }

  setControlValue(next: TValue) {
    this.cancelControlDebounce();
    this.controlValue.set(next);
    this.selfDirty.set(true);
    const debounce = this.controlDebounce() ?? 0;
    const isImmediate = typeof debounce === 'number' && (!Number.isFinite(debounce) || debounce <= 0);
    if (Object.is(next, this.value()) || isImmediate) {
      this.value.set(next);
      return;
    }
    this.debouncing.set(true);
    this.debounceStrategy = debounce;
    if (debounce === 'blur') return;
    if (typeof debounce === 'function') return this.startCustomControlDebounce(debounce);
    // Scheduled callbacks retain only a weak reference to the field state.
    const stateRef = this.stateRef;
    this.debounceTimer = setTimeout(() => stateRef.deref()?.commitControlValue(), debounce);
  }

  reset(...args: [] | [value: TValue]) {
    this.cancelControlDebounce();
    if (args.length === 1) this.value.set(args[0]);
    this.controlValue.set(this.value());
    this.selfTouched.set(false);
    this.selfDirty.set(false);
    notifyExternalValidationReset(this.node);
    this.controlBindings.forEach(binding => binding.reset?.());
  }

  markAsTouched() {
    if (this.nonInteractive()) return;
    this.selfTouched.set(true);
    this.commitControlValue();
  }

  flushControlValueOnBlur() {
    if (this.debounceStrategy === 'blur') this.commitControlValue();
  }

  setValidators(next: ValidatorSource<TValue, Field<TValue>>) {
    this.validators.set(normalizeValidatorSource(next));
    this.ensureAsyncValidationWatch();
  }

  ensureAsyncValidationWatch() {
    if (this.asyncValidationWatchTarget || !this.validators().some(isAsyncValidator)) return;
    this.asyncValidationWatchTarget = {
      run: this.asyncValidation.validate,
      cleanup: this.asyncValidation.cancel,
      destroy: this.asyncValidation.destroy,
    };
    this.asyncValidationWatchRef = createReactiveWatch(this.asyncValidationWatchTarget, null);
    watchNodeInjector(this.node, injector => this.asyncValidationWatchRef?.setInjector(injector));
  }

  setParent(parent: Node | null, key?: string) {
    this.parent.set(parent);
    this.keyInParent.set(parent ? key ?? null : null);
    refreshNodeInjector(this.node);
  }

  registerControlBinding(binding: NodeControlBinding) {
    this.controlBindings.add(binding);
    return () => { this.controlBindings.delete(binding); };
  }

  getControlBindingForFocus() {
    return findFirstControlBindingInDom(this.controlBindings);
  }

  startCustomControlDebounce(debounce: (abortSignal: AbortSignal) => void | PromiseLike<void>) {
    const stateRef = this.stateRef;
    const controller = new AbortController();
    this.debounceController = controller;
    let completion: void | PromiseLike<void>;
    try {
      completion = debounce(controller.signal);
    } catch (error) {
      this.cancelControlDebounce();
      throw error;
    }
    if (completion === undefined) {
      this.commitControlValue();
      return;
    }
    // Obsolete promises must not retain a cancelled controller or its abort reason.
    const controllerRef = new WeakRef(controller);
    Promise.resolve(completion).then(
      () => stateRef.deref()?.resolveControlDebounce(controllerRef),
      () => stateRef.deref()?.rejectControlDebounce(controllerRef),
    );
  }

  commitControlValue() {
    this.cancelControlDebounce();
    this.value.set(this.controlValue());
  }

  resolveControlDebounce(controllerRef: WeakRef<AbortController>) {
    const controller = controllerRef.deref();
    if (this.debounceController === controller && !controller.signal.aborted) this.commitControlValue();
  }

  rejectControlDebounce(controllerRef: WeakRef<AbortController>) {
    const controller = controllerRef.deref();
    if (this.debounceController === controller) this.cancelControlDebounce();
  }

  cancelControlDebounce() {
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
    this.debounceController?.abort();
    this.debounceTimer = null;
    this.debounceController = null;
    this.debounceStrategy = undefined;
    this.debouncing.set(false);
  }

  createClone() {
    // Capture configuration now so the retained callback does not reference this instance.
    const { initialValue, initialValidatorSource, cloneOptions } = this;
    return () => new FieldNode<TValue>(initialValue, initialValidatorSource, cloneOptions).getNode();
  }

  createNode(): Field<TValue> {
    const publicApi: FieldApi<TValue> = {
      nodeType: () => 'field' as const,
      form: this.form,
      root: this.root,
      parent: this.parent.asReadonly(),
      path: this.path,
      keyInParent: this.keyInParent.asReadonly(),
      value: this.value.asReadonly(),
      controlValue: this.controlValue.asReadonly(),
      set: (next: TValue) => this.set(next),
      patch: (next: TValue) => this.set(next),
      update: (updater: (value: TValue) => TValue) => untracked(() => this.set(updater(this.value()))),
      setControlValue: (next: TValue) => this.setControlValue(next),
      debouncing: this.debouncing.asReadonly(),
      flush: () => this.commitControlValue(),
      focus: (options?: FocusOptions) => this.getControlBindingForFocus()?.focus(options),
      reset: (...args: [] | [value: TValue]) => this.reset(...args),
      validators: this.validators.asReadonly(),
      setValidators: (next: ValidatorSource<TValue, Field<TValue>>) => this.setValidators(next),
      errors: this.errors,
      allErrors: this.errors,
      valid: this.valid,
      invalid: this.invalid,
      getError: this.getError,
      min: this.min,
      max: this.max,
      minLength: this.minLength,
      maxLength: this.maxLength,
      pattern: this.pattern,
      required: this.required,
      pending: this.pending,
      submitting: this.submitting,
      validationStatus: this.validationStatus,
      touched: this.touched,
      untouched: this.untouched,
      markAsTouched: (_options?: MarkAsTouchedOptions) => this.markAsTouched(),
      markAsUntouched: () => this.selfTouched.set(false),
      dirty: this.dirty,
      pristine: this.pristine,
      markAsDirty: () => this.selfDirty.set(true),
      markAsPristine: () => this.selfDirty.set(false),
      disabled: this.disabled,
      disabledReasons: this.disabledReasons,
      enabled: this.enabled,
      disable: (message?: string) => this.selfDisabled.set(message ?? true),
      enable: () => this.selfDisabled.set(false),
      readonly: this.readonly,
      writable: this.writable,
      markAsReadonly: () => this.selfReadonly.set(true),
      markAsWritable: () => this.selfReadonly.set(false),
      hidden: this.hidden,
      visible: this.visible,
      hide: () => this.selfHidden.set(true),
      show: () => this.selfHidden.set(false),
    };

    const internalApi = {
      ...publicApi,
      _controlDebounce: this.controlDebounce,
      _controlValue: this.controlValue.asReadonly(),
      _setControlValue: publicApi.setControlValue,
      _flushControlValueOnBlur: () => this.flushControlValueOnBlur(),
      _clone: this.createClone(),
      _setParent: (parent: Node | null, key?: string) => this.setParent(parent, key),
      _refreshInjector: () => refreshNodeInjector(this.node),
      _registerControlBinding: (binding: NodeControlBinding) => this.registerControlBinding(binding),
      _getControlBindingForFocus: () => this.getControlBindingForFocus(),
    };

    return Object.defineProperties(
      () => this.value(),
      Object.getOwnPropertyDescriptors({ ...publicApi, api: internalApi, $api: internalApi }),
    ) as Field<TValue>;
  }
}
