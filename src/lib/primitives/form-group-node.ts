import { computed, signal, untracked } from '@angular/core';

import { isNotNil } from '../utils/is-nil';
import { readMetadata } from '../metadata/metadata';
import { shallowEqual } from '../utils/shallow-equal';
import { isPlainObject } from '../utils/is-plain-object';
import { isNode, markAsNode } from './utils/node-marker';
import { mapObjectValues } from '../utils/map-object-values';
import { computedFunction } from '../utils/computed-function';
import { registerAngularField } from '../interop/angular-field';
import { runSyncValidators } from '../validation/run-sync-validators';
import { createNodeMetadata } from '../metadata/create-node-metadata';
import { REQUIRED_METADATA } from '../validation/validators/required';
import { isAsyncValidator } from '../validation/utils/async-validator-marker';
import { markAsFieldContext } from '../validation/utils/field-context-marker';
import { createAsyncValidation } from '../validation/create-async-validation';
import { normalizeValidatorSource } from '../validation/utils/validator-source';
import { registerNodeValidatorMessages } from '../validation/validator-messages';
import { readStateSource, getInitialMutableState } from './utils/read-state-source';
import { createNodeDefinitionFactory } from './utils/create-node-definition-factory';
import { createValidatorContext } from '../validation/utils/create-validator-context';
import { assertValidObjectDefinition, normalizeObjectDefinition } from './form-group-node.utils';
import { refreshNodeInjector, registerNodeInjector, watchNodeInjector } from '../utils/node-injector';
import { firstControlBindingInDom, findFirstControlBindingInDom } from '../utils/node-control-binding';
import { createControlValueBuffer, type ControlValueBuffer } from './utils/create-control-value-buffer';
import { createReactiveWatch, type ReactiveWatchRef, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import { notifyExternalValidationReset, readExternalValidationErrors } from '../validation/external-validation-errors';
import type { DynamicNode, InternalNode, MarkAsTouchedOptions, Node, NodeControlBinding, Nodes } from '../types/node.type';
import type { FieldContext, ValidationStatus, ValidatorContext, ValidatorSource, Validators } from '../validation/validation.type';
import { createDisabledReason, getInitialDisabledState, readConfiguredDisabledState, type DisabledState } from './utils/disabled-reasons';
import type { Form, FormApi, FormChildren, FormOptions, FormPatch, FormSet, FormValue, NormalizedNodes, ObjectNodeDefinitions } from './form.type';

export function createFormGroupNode<TDefinitions extends ObjectNodeDefinitions>(
  definitions: TDefinitions,
  validatorSource: ValidatorSource<FormValue<NormalizedNodes<TDefinitions>>, any>,
  options: FormOptions<FormValue<NormalizedNodes<TDefinitions>>, any> | undefined,
  nodeType: 'form' | 'group',
  normalizeDefinition: (definition: unknown) => Node = normalizeObjectDefinition,
): Node {
  return new FormGroupNode<NormalizedNodes<TDefinitions>>(definitions, validatorSource, options, nodeType, normalizeDefinition).getNode();
}

/**
 * Shared implementation behind `form()` and `group()`: both own object-shaped children and share
 * state, validation, and control integration. The node type determines form ownership and whether
 * the public API exposes `submit()`; groups inherit their owning form and submission state.
 */
export class FormGroupNode<TNodes extends Nodes> {
  node: Form<TNodes>;

  children: TNodes;

  childrenRecord: Record<string, Node>;

  dynamicKeys = new Set<string>();

  createDefinitions: ReturnType<typeof createNodeDefinitionFactory>;

  cloneOptions: FormOptions<FormValue<TNodes>, any> | undefined;

  controlBindings = new Set<NodeControlBinding>();

  controlValueBuffer: ControlValueBuffer<FormValue<TNodes>, FormSet<TNodes>>;

  context: FieldContext<FormValue<TNodes>>;

  emptySyncMetadata = new Map();

  metadata: ReturnType<typeof createNodeMetadata>;

  asyncValidation: ReturnType<typeof createAsyncValidation<FormValue<TNodes>, Form<TNodes>>>;

  asyncValidationWatchTarget: ReactiveWatchTarget | null = null;

  asyncValidationWatchRef: ReactiveWatchRef | null = null;

  parent = signal<Node | null>(null);

  keyInParent = signal<string | number | null>(null);

  structureVersion = signal(0);

  selfDisabled = signal<DisabledState>(false);

  selfReadonly = signal(false);

  selfHidden = signal(false);

  selfTouched = signal(false);

  selfDirty = signal(false);

  selfSubmitting = signal(false);

  validators = signal<Validators<FormValue<TNodes>>>([]);

  getError = computedFunction((kind: string) => {
    return this.errors().find(error => error.kind === kind);
  }, { equal: shallowEqual, max: 20 }) as FormApi<TNodes>['getError'];

  path = computed((): readonly string[] => {
    const parent = this.parent();
    const key = this.keyInParent();
    return parent && key !== null ? [...parent.$api.path(), String(key)] : [];
  });

  form = computed(() => this.nodeType === 'form' ? this.node : this.parent()?.$api.form() ?? null);

  root = computed(() => this.parent()?.$api.root() ?? this.node) as FormApi<TNodes>['root'];

  value = computed(() => {
    const value = {} as FormValue<TNodes>;
    this.getChildKeys().forEach((key) => { value[key] = this.children[key]!(); });
    return value;
  });

  controlDebounce = computed(() => {
    return this.options?.debounce
      ?? (this.parent() as InternalNode | null)?.$api._controlDebounce();
  });

  debouncing = computed(() => {
    return this.controlValueBuffer.debouncing()
      || this.getChildKeys().some(key => this.children[key]!.$api.debouncing());
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

  touched = computed(() => {
    return !this.nonInteractive() && (this.selfTouched() || this.getChildKeys().some(key => this.children[key]!.$api.touched()));
  });

  untouched = computed(() => !this.touched());

  dirty = computed(() => {
    return !this.nonInteractive() && (this.selfDirty() || this.getChildKeys().some(key => this.children[key]!.$api.dirty()));
  });

  pristine = computed(() => !this.dirty());

  submitting = computed(() => {
    return this.selfSubmitting() || this.parent()?.$api.submitting() === true;
  });

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

  allErrors = computed(() => [
    ...this.errors(),
    ...this.getChildKeys().flatMap(key => this.children[key]!.$api.allErrors()),
  ], { equal: shallowEqual });

  pending = computed(() => {
    return !this.nonInteractive()
      && (this.asyncValidation.pending() || this.getChildKeys().some(key => this.children[key]!.$api.pending()));
  });

  validationStatus = computed<ValidationStatus>(() => {
    if (this.nonInteractive()) return 'valid';
    if (this.errors().length > 0 || this.getChildKeys().some(key => this.children[key]!.$api.invalid())) return 'invalid';
    if (this.pending()) return 'unknown';
    return 'valid';
  });

  valid = computed(() => this.validationStatus() === 'valid');

  invalid = computed(() => this.validationStatus() === 'invalid');

  required = computed(() => {
    return readMetadata(this.metadata(), REQUIRED_METADATA)
      || this.errors().some(error => error.kind === 'required');
  });

  constructor(
    definitions: ObjectNodeDefinitions,
    public initialValidatorSource: ValidatorSource<FormValue<TNodes>, any>,
    public options: FormOptions<FormValue<TNodes>, any> | undefined,
    public nodeType: 'form' | 'group',
    public normalizeDefinition: (definition: unknown) => Node,
  ) {
    const validators = normalizeValidatorSource(this.initialValidatorSource);
    this.cloneOptions = this.options === undefined ? undefined : { ...this.options };
    assertValidObjectDefinition(definitions, this.nodeType);
    this.children = mapObjectValues(definitions, normalizeDefinition) as TNodes;
    this.createDefinitions = createNodeDefinitionFactory(this.children);
    this.childrenRecord = this.children;
    const disabled = getInitialDisabledState(this.options?.disabled);
    const readonly = getInitialMutableState(this.options?.readonly);
    const hidden = getInitialMutableState(this.options?.hidden);

    // Seed local state before helpers read the aggregate value or validation context.
    untracked(() => {
      this.selfDisabled.set(disabled);
      this.selfReadonly.set(readonly);
      this.selfHidden.set(hidden);
      this.validators.set(validators);
    });

    this.context = markAsFieldContext({ value: this.value });
    this.metadata = createNodeMetadata(
      this.validators,
      computed(() => this.syncValidation().metadata),
      () => createValidatorContext(this.context, this.node) as ValidatorContext<unknown>,
    );
    this.asyncValidation = createAsyncValidation(
      this.context,
      this.validators,
      this.syncErrors,
      () => this.node,
      () => !this.nonInteractive(),
    );
    this.controlValueBuffer = createControlValueBuffer(
      this.value,
      this.controlDebounce,
      value => this.set(value),
      () => this.selfDirty.set(true),
    );

    this.node = this.createNode();
    this.getChildKeys().forEach(key => (this.children[key] as InternalNode).$api._setParent(this.node, String(key)));
    markAsNode(this.node);
    registerNodeInjector(this.node, this.options?.injector, this.options?.inheritInjector !== false, this.options?.adoptBindingInjector !== false);
    registerAngularField(this.node);
    registerNodeValidatorMessages(this.node, this.options?.validatorMessages, this.options?.injector);
    this.refreshInjector();
    this.ensureAsyncValidationWatch();
  }

  getNode() {
    return this.node;
  }

  getChildKeys() {
    this.structureVersion();
    return Object.keys(this.children) as (keyof TNodes)[];
  }

  add(...args: [string | ObjectNodeDefinitions, unknown?]) {
    const [keyOrDefinitions, definition] = args;
    if (typeof keyOrDefinitions === 'string') {
      if (args.length < 2) throw new Error(`${this.nodeType}: add(key, definition) requires a definition argument`);
      const definitions = { [keyOrDefinitions]: definition };
      const added = this.addDynamicChildren(definitions, [[keyOrDefinitions, definition]]);
      return added[keyOrDefinitions];
    }
    return this.addDynamicChildren(keyOrDefinitions, Object.entries(keyOrDefinitions));
  }

  remove(key: string) {
    const node = this.childrenRecord[key];
    if (!node) return undefined;
    if (!this.dynamicKeys.has(key)) {
      throw new Error(`${this.nodeType}: initially declared child "${key}" cannot be removed`);
    }
    this.dynamicKeys.delete(key);
    delete this.childrenRecord[key];
    (node as InternalNode).$api._setParent(null);
    this.structureVersion.update(version => version + 1);
    return node;
  }

  addDynamicChildren(definitions: ObjectNodeDefinitions, entries: readonly (readonly [string, unknown])[]) {
    entries.forEach(([key]) => this.assertAvailableDynamicKey(key));
    assertValidObjectDefinition(definitions, this.nodeType);
    entries.forEach(([, definition]) => this.assertDetachedDefinition(definition));
    const normalizeDefinition = this.normalizeDefinition;
    const nodes = entries.map(([key, definition]) => [key, normalizeDefinition(definition)] as const);
    nodes.forEach(([key, node]) => {
      this.childrenRecord[key] = node;
      this.dynamicKeys.add(key);
      (node as InternalNode).$api._setParent(this.node, key);
    });
    this.structureVersion.update(version => version + 1);
    return Object.fromEntries(nodes);
  }

  assertAvailableDynamicKey(key: string) {
    if (key === '$api' || key === '$field') {
      throw new Error(`${this.nodeType}: "${key}" is reserved and cannot be added as a dynamic child`);
    }
    if (Object.prototype.hasOwnProperty.call(this.childrenRecord, key)) {
      throw new Error(`${this.nodeType}: child "${key}" already exists`);
    }
  }

  assertDetachedDefinition(definition: unknown) {
    if (isNode(definition)) {
      if ((definition as Node & { $api: { parent(): Node | null } }).$api.parent() === null) return;
      throw new Error(`${this.nodeType}: a dynamic child must not already have a parent`);
    }
    if (definition !== null && typeof definition === 'object' && isPlainObject(definition)) {
      Object.values(definition).forEach(child => this.assertDetachedDefinition(child));
    }
  }

  set(value: FormSet<TNodes>) {
    this.controlValueBuffer?.cancel();
    (Object.keys(value) as (keyof TNodes)[]).forEach((key) => {
      const control = this.children[key];
      if (control === undefined) {
        console.warn(`form: unknown key "${String(key)}" ignored on set`);
        return;
      }
      control.$api.set(value[key]);
    });
  }

  patch(value: FormPatch<TNodes>) {
    this.controlValueBuffer?.cancel();
    (Object.keys(value) as (keyof TNodes)[]).forEach((key) => {
      const control = this.children[key] as Node | undefined;
      if (control === undefined) {
        console.warn(`form: unknown key "${String(key)}" ignored on patch`);
        return;
      }
      control.$api.patch(value[key]);
    });
  }

  reset(...args: [] | [value: FormSet<TNodes>]) {
    this.controlValueBuffer?.cancel();
    this.selfTouched.set(false);
    this.selfDirty.set(false);
    notifyExternalValidationReset(this.node);
    if (args.length === 0) {
      this.getChildKeys().forEach(key => this.children[key]!.$api.reset());
      this.controlBindings.forEach(binding => binding.reset?.());
      return;
    }
    const value = args[0];
    this.getChildKeys().forEach((key) => {
      const dynamicKey = String(key);
      if (this.dynamicKeys.has(dynamicKey) && !Object.prototype.hasOwnProperty.call(value, key)) {
        this.children[key]!.$api.reset();
        return;
      }
      this.children[key]!.$api.reset(value[key]);
    });
    this.controlBindings.forEach(binding => binding.reset?.());
  }

  markAsTouched(options?: MarkAsTouchedOptions) {
    if (this.nonInteractive()) return;
    this.selfTouched.set(true);
    this.controlValueBuffer.flush();
    if (!options?.skipDescendants) this.getChildKeys().forEach(key => this.children[key]!.$api.markAsTouched());
  }

  flush() {
    this.controlValueBuffer.flush();
    this.getChildKeys().forEach(key => this.children[key]!.$api.flush());
  }

  async submit(): Promise<boolean> {
    if (untracked(this.submitting)) return false;
    const submission = this.options?.submission;
    this.node.$api.markAsTouched();
    if (!submission) return false;
    const shouldRun = submission.ignoreValidators === 'all'
      || (submission.ignoreValidators === 'none' ? untracked(this.node.$api.valid) : !untracked(this.node.$api.invalid));
    if (!shouldRun) {
      untracked(() => submission.onInvalid?.(this.node));
      return false;
    }
    this.selfSubmitting.set(true);
    try {
      await untracked(() => submission.action(this.node, this.value()));
      return true;
    } finally {
      this.selfSubmitting.set(false);
    }
  }

  setValidators(next: ValidatorSource<FormValue<TNodes>>) {
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
    this.refreshInjector();
  }

  refreshInjector() {
    refreshNodeInjector(this.node);
    this.getChildKeys().forEach(key => (this.children[key] as InternalNode).$api._refreshInjector());
  }

  registerControlBinding(binding: NodeControlBinding) {
    this.controlBindings.add(binding);
    return () => { this.controlBindings.delete(binding); };
  }

  getControlBindingForFocus() {
    const own = findFirstControlBindingInDom(this.controlBindings);
    if (own) return own;
    return this.getChildKeys()
      .map(key => (this.children[key] as InternalNode).$api._getControlBindingForFocus())
      .reduce(firstControlBindingInDom, undefined);
  }

  createClone() {
    // Capture declarative inputs without retaining this instance or its parent tree.
    const { createDefinitions, initialValidatorSource, cloneOptions, nodeType, normalizeDefinition } = this;
    return () => {
      return new FormGroupNode<TNodes>(
        createDefinitions() as ObjectNodeDefinitions,
        initialValidatorSource,
        cloneOptions,
        nodeType,
        normalizeDefinition,
      ).getNode();
    };
  }

  createNode(): Form<TNodes> {
    const publicApi = {
      nodeType: () => this.nodeType,
      children: this.children as FormChildren<TNodes, Node>,
      get: (key: string) => this.childrenRecord[key] as DynamicNode | undefined,
      add: ((...args: [string | ObjectNodeDefinitions, unknown?]) => this.add(...args)) as FormApi<TNodes>['add'],
      remove: (key: string) => this.remove(key),
      form: this.form,
      root: this.root,
      parent: this.parent.asReadonly(),
      path: this.path,
      keyInParent: this.keyInParent.asReadonly(),
      value: this.value,
      controlValue: this.controlValueBuffer.controlValue,
      set: (value: FormSet<TNodes>) => this.set(value),
      update: (updater: (value: FormValue<TNodes>) => FormSet<TNodes>) => untracked(() => this.set(updater(this.value()))),
      patch: (value: FormPatch<TNodes>) => this.patch(value),
      reset: (...args: [] | [value: FormSet<TNodes>]) => this.reset(...args),
      validators: this.validators.asReadonly(),
      setValidators: (next: ValidatorSource<FormValue<TNodes>>) => this.setValidators(next),
      errors: this.errors,
      allErrors: this.allErrors,
      valid: this.valid,
      invalid: this.invalid,
      getError: this.getError,
      required: this.required,
      pending: this.pending,
      submitting: this.submitting,
      ...(this.nodeType === 'form' ? { submit: () => this.submit() } : {}),
      debouncing: this.debouncing,
      flush: () => this.flush(),
      focus: (options?: FocusOptions) => this.getControlBindingForFocus()?.focus(options),
      validationStatus: this.validationStatus,
      touched: this.touched,
      untouched: this.untouched,
      markAsTouched: (options?: MarkAsTouchedOptions) => this.markAsTouched(options),
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
    } as unknown as FormApi<TNodes>;

    const internalApi = {
      ...publicApi,
      _controlDebounce: this.controlDebounce,
      _controlValue: publicApi.controlValue,
      _setControlValue: this.controlValueBuffer.set,
      _flushControlValueOnBlur: publicApi.flush,
      _clone: this.createClone(),
      _setParent: (parent: Node | null, key?: string) => this.setParent(parent, key),
      _refreshInjector: () => this.refreshInjector(),
      _registerControlBinding: (binding: NodeControlBinding) => this.registerControlBinding(binding),
      _getControlBindingForFocus: () => this.getControlBindingForFocus(),
    };

    // Child names can replace callable properties and API aliases; $api stays collision-safe.
    return Object.defineProperties(
      () => this.value(),
      Object.getOwnPropertyDescriptors({ ...publicApi, api: internalApi, ...this.children, $api: internalApi }),
    ) as Form<TNodes>;
  }
}
