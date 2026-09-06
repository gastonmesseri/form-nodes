import { computed, signal, untracked, type Signal } from '@angular/core';

import { group } from './group';
import { isNotNil } from '../utils/is-nil';
import { readMetadata } from '../metadata/metadata';
import { shallowEqual } from '../utils/shallow-equal';
import { isPlainObject } from '../utils/is-plain-object';
import { isNode, markAsNode } from './utils/node-marker';
import type { ObjectNodeDefinitions } from './form.type';
import { assertArrayObjectTemplate } from './array.utils';
import { computedFunction } from '../utils/computed-function';
import { registerAngularField } from '../interop/angular-field';
import { createNodeMetadata } from '../metadata/create-node-metadata';
import { runSyncValidators } from '../validation/run-sync-validators';
import { REQUIRED_METADATA } from '../validation/validators/required';
import { isAsyncValidator } from '../validation/utils/async-validator-marker';
import { markAsFieldContext } from '../validation/utils/field-context-marker';
import { createAsyncValidation } from '../validation/create-async-validation';
import { normalizeValidatorSource } from '../validation/utils/validator-source';
import { registerNodeValidatorMessages } from '../validation/validator-messages';
import { readStateSource, getInitialMutableState } from './utils/read-state-source';
import { createValidatorContext } from '../validation/utils/create-validator-context';
import { refreshNodeInjector, registerNodeInjector, watchNodeInjector } from '../utils/node-injector';
import { firstControlBindingInDom, findFirstControlBindingInDom } from '../utils/node-control-binding';
import { createControlValueBuffer, type ControlValueBuffer } from './utils/create-control-value-buffer';
import { createReactiveWatch, type ReactiveWatchRef, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import { notifyExternalValidationReset, readExternalValidationErrors } from '../validation/external-validation-errors';
import type { InternalNode, MarkAsTouchedOptions, Node, NodeControlBinding, NodeSet, NodeValue } from '../types/node.type';
import type { FieldContext, ValidationStatus, ValidatorContext, ValidatorSource, Validators } from '../validation/validation.type';
import { createDisabledReason, getInitialDisabledState, readConfiguredDisabledState, type DisabledState } from './utils/disabled-reasons';
import type { ArrayApi, ArrayItemWithParent, ArrayItems, ArrayNode as ArrayNodeType, ArrayOptions, ArrayPatch, ArraySet, ArrayValue } from './array.type';

type ArrayItemNode<TItem extends Node> = ArrayItemWithParent<TItem, ArrayNodeType<TItem>>;

/** Owns a dynamic array's state and operations behind its callable public node. */
export class ArrayNode<TItem extends Node> {
  node: ArrayNodeType<TItem>;

  cloneOptions: Omit<ArrayOptions<ArrayValue<TItem>, any>, 'initialValue'> | undefined;

  cloneInitial: number | ArraySet<TItem>;

  usedDefinitions = new WeakSet<object>();

  preparedSchemaItem: TItem | undefined;

  usesTrackBy: boolean;

  controlBindings = new Set<NodeControlBinding>();

  controlValueBuffer: ControlValueBuffer<ArrayValue<TItem>, ArraySet<TItem>>;

  context: FieldContext<ArrayValue<TItem>>;

  emptySyncMetadata = new Map();

  metadata: ReturnType<typeof createNodeMetadata>;

  asyncValidation: ReturnType<typeof createAsyncValidation<ArrayValue<TItem>, ArrayNodeType<TItem>>>;

  asyncValidationWatchTarget: ReactiveWatchTarget | null = null;

  asyncValidationWatchRef: ReactiveWatchRef | null = null;

  parent = signal<Node | null>(null);

  keyInParent = signal<string | number | null>(null);

  items = signal<readonly TItem[]>([]);

  selfDisabled = signal<DisabledState>(false);

  selfReadonly = signal(false);

  selfHidden = signal(false);

  selfTouched = signal(false);

  selfDirty = signal(false);

  validators = signal<Validators<ArrayValue<TItem>>>([]);

  getError = computedFunction((kind: string) => {
    return this.errors().find(error => error.kind === kind);
  }, { equal: shallowEqual, max: 20 }) as ArrayApi<TItem>['getError'];

  path = computed<readonly string[]>(() => {
    const parent = this.parent();
    const key = this.keyInParent();
    return parent && key !== null ? [...parent.$api.path(), String(key)] : [];
  });

  form = computed(() => this.parent()?.$api.form() ?? null) as ArrayApi<TItem>['form'];

  root = computed(() => this.parent()?.$api.root() ?? this.node) as ArrayApi<TItem>['root'];

  length = computed(() => this.items().length);

  value = computed<ArrayValue<TItem>>(() => this.items().map(item => item()) as ArrayValue<TItem>);

  controlDebounce = computed(() => {
    return this.options?.debounce
      ?? (this.parent() as InternalNode | null)?.$api._controlDebounce();
  });

  debouncing = computed(() => {
    return this.controlValueBuffer.debouncing()
      || this.items().some(item => item.$api.debouncing());
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
    return !this.nonInteractive() && (this.selfTouched() || this.items().some(item => item.$api.touched()));
  });

  untouched = computed(() => !this.touched());

  dirty = computed(() => {
    return !this.nonInteractive() && (this.selfDirty() || this.items().some(item => item.$api.dirty()));
  });

  pristine = computed(() => !this.dirty());

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

  allErrors = computed(() => [
    ...this.errors(),
    ...this.items().flatMap(item => item.$api.allErrors()),
  ], { equal: shallowEqual });

  validationStatus = computed<ValidationStatus>(() => {
    if (this.nonInteractive()) return 'valid';
    if (this.errors().length > 0 || this.items().some(item => item.$api.invalid())) return 'invalid';
    if (this.pending()) return 'unknown';
    return 'valid';
  });

  valid = computed(() => this.validationStatus() === 'valid');

  invalid = computed(() => this.validationStatus() === 'invalid');

  pending = computed(() => {
    return !this.nonInteractive()
      && (this.asyncValidation.pending() || this.items().some(item => item.$api.pending()));
  });

  required = computed(() => {
    return readMetadata(this.metadata(), REQUIRED_METADATA)
      || this.errors().some(error => error.kind === 'required');
  });

  constructor(
    public itemFactory: () => unknown,
    initial: number | ArraySet<TItem>,
    public initialValidatorSource: ValidatorSource<ArrayValue<TItem>, any>,
    public options?: ArrayOptions<ArrayValue<TItem>, any>,
  ) {
    if (this.options !== undefined) {
      const { initialValue: _initialValue, ...cloneOptions } = this.options;
      this.cloneOptions = cloneOptions;
    }
    this.cloneInitial = typeof initial === 'number' ? initial : [...initial] as ArraySet<TItem>;
    const initialItems = this.createInitialItems(initial);
    const { disabled, readonly, hidden } = this.options ?? {};
    const validators = normalizeValidatorSource<ArrayValue<TItem>, any>(this.initialValidatorSource);

    // Seed local state before helpers read the aggregate value or validation context.
    untracked(() => {
      this.items.set(initialItems);
      this.selfDisabled.set(getInitialDisabledState(disabled));
      this.selfReadonly.set(getInitialMutableState(readonly));
      this.selfHidden.set(getInitialMutableState(hidden));
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

    this.usesTrackBy = this.options?.trackBy !== undefined;
    this.controlValueBuffer = createControlValueBuffer(
      this.value,
      this.controlDebounce,
      value => this.set(value),
      () => this.selfDirty.set(true),
    );

    this.node = this.createNode();
    this.reparentItems();
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

  getItemSnapshot() {
    return [...this.items()] as ArrayItemNode<TItem>[];
  }

  forEach(callback: (item: ArrayItemNode<TItem>, index: number, array: ArrayNodeType<TItem>) => void) {
    const snapshot = this.items();
    snapshot.forEach((item, index) => callback(item as ArrayItemNode<TItem>, index, this.node));
  }

  filter(predicate: (
    item: ArrayItemNode<TItem>,
    index: number,
    array: ArrayNodeType<TItem>,
  ) => unknown) {
    return this.getItemSnapshot().filter((item, index) => predicate(item, index, this.node));
  }

  find(predicate: (
    item: ArrayItemNode<TItem>,
    index: number,
    array: ArrayNodeType<TItem>,
  ) => unknown) {
    return this.getItemSnapshot().find((item, index) => predicate(item, index, this.node));
  }

  insert(index: number, ...args: [] | [value: NodeSet<TItem>]) {
    this.assertIndex(index, true);
    const item = this.createItem();
    if (args.length === 1) item.$api.reset(args[0]);
    const next = [...this.items()];
    next.splice(index, 0, item);
    this.items.set(next);
    this.reparentItems();
    return item as ArrayItemNode<TItem>;
  }

  removeAt(index: number) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.items().length) return undefined;
    const next = [...this.items()];
    const [removed] = next.splice(index, 1);
    this.items.set(next);
    this.detachItem(removed!);
    this.reparentItems();
    return removed as ArrayItemNode<TItem>;
  }

  moveUp(index: number) {
    this.assertIndex(index);
    if (index > 0) this.move(index, index - 1);
  }

  moveDown(index: number) {
    this.assertIndex(index);
    if (index < this.items().length - 1) this.move(index, index + 1);
  }

  move(fromIndex: number, toIndex: number) {
    this.assertIndex(fromIndex);
    this.assertIndex(toIndex);
    if (fromIndex === toIndex) return;
    const next = [...this.items()];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item!);
    this.items.set(next);
    this.reparentItems();
  }

  swap(firstIndex: number, secondIndex: number) {
    this.assertIndex(firstIndex);
    this.assertIndex(secondIndex);
    if (firstIndex === secondIndex) return;
    const next = [...this.items()];
    [next[firstIndex], next[secondIndex]] = [next[secondIndex]!, next[firstIndex]!];
    this.items.set(next);
    this.reparentItems();
  }

  clear() {
    if (this.items().length === 0) return;
    this.items().forEach(item => this.detachItem(item));
    this.items.set([]);
  }

  assertIndex(index: number, allowEnd = false) {
    const maximum = this.items().length - (allowEnd ? 0 : 1);
    if (!Number.isSafeInteger(index) || index < 0 || index > maximum) {
      throw new RangeError(`array: index ${index} is out of bounds`);
    }
  }

  set(value: ArraySet<TItem> | null | undefined) {
    this.controlValueBuffer?.cancel();
    this.reconcile(this.normalizeArrayValue(value), 'set');
  }

  patch(value: ArrayPatch<TItem>) {
    this.controlValueBuffer.cancel();
    value.forEach((itemValue, index) => {
      const item = this.items()[index];
      if (item) item.$api.patch(itemValue);
      else console.warn(`array: unknown index ${index} ignored on patch`);
    });
  }

  reset(...args: [] | [value: ArraySet<TItem> | null | undefined]) {
    this.controlValueBuffer?.cancel();
    if (args.length === 0) this.items().forEach(item => item.$api.reset());
    else this.reconcile(this.normalizeArrayValue(args[0]), 'reset');
    this.selfTouched.set(false);
    this.selfDirty.set(false);
    notifyExternalValidationReset(this.node);
    this.controlBindings.forEach(binding => binding.reset?.());
  }

  markAsTouched(options?: MarkAsTouchedOptions) {
    if (this.nonInteractive()) return;
    this.selfTouched.set(true);
    this.controlValueBuffer.flush();
    if (!options?.skipDescendants) this.items().forEach(item => item.$api.markAsTouched());
  }

  flush() {
    this.controlValueBuffer.flush();
    this.items().forEach(item => item.$api.flush());
  }

  setValidators(next: ValidatorSource<ArrayValue<TItem>, ArrayNodeType<TItem>>) {
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

  reparentItems() {
    this.items().forEach((item, index) => (item as unknown as InternalNode).$api._setParent(this.node, index));
  }

  detachItem(item: TItem) {
    return (item as unknown as InternalNode).$api._setParent(null);
  }

  refreshInjector() {
    refreshNodeInjector(this.node);
    this.items().forEach(item => (item as unknown as InternalNode).$api._refreshInjector());
  }

  registerControlBinding(binding: NodeControlBinding) {
    this.controlBindings.add(binding);
    return () => { this.controlBindings.delete(binding); };
  }

  getControlBindingForFocus() {
    const own = findFirstControlBindingInDom(this.controlBindings);
    if (own) return own;
    return this.items()
      .map(item => (item as unknown as InternalNode).$api._getControlBindingForFocus())
      .reduce(firstControlBindingInDom, undefined);
  }

  createInitialItems(initial: number | ArraySet<TItem>) {
    const values = typeof initial === 'number' ? null : [...initial];
    const count = typeof initial === 'number' ? initial : initial.length;
    return Array.from({ length: count }, (_, index) => {
      const item = this.createItem();
      if (values) item.$api.reset(values[index]!);
      return item;
    });
  }

  getSchemaSample(): TItem {
    // Reserve the schema sample for the next createItem() call so it becomes a real array item.
    this.preparedSchemaItem ??= this.instantiateItem();
    return this.preparedSchemaItem;
  }

  createItem(): TItem {
    const item = this.preparedSchemaItem ?? this.instantiateItem();
    this.preparedSchemaItem = undefined;
    return item;
  }

  instantiateItem(): TItem {
    const itemFactory = this.itemFactory;
    const definition = itemFactory();
    this.trackDefinition(definition, true);
    if (isNode(definition)) return definition as TItem;
    assertArrayObjectTemplate(definition, 'factory');
    return group(definition as ObjectNodeDefinitions) as TItem;
  }

  trackDefinition(definition: unknown, root = false) {
    if (definition === null || (typeof definition !== 'object' && typeof definition !== 'function')) return;
    const structural = root || isNode(definition) || isPlainObject(definition);
    if (!structural) return;
    if (this.usedDefinitions.has(definition)) {
      throw new Error('array: factory must return a fresh node definition for every item');
    }
    this.usedDefinitions.add(definition);
    if (!isNode(definition) && (root || isPlainObject(definition))) {
      Object.values(definition).forEach(child => this.trackDefinition(child));
    }
  }

  reconcile(values: ArraySet<TItem>, mode: 'set' | 'reset') {
    if (this.usesTrackBy) this.reconcileByKey(values, mode);
    else this.reconcileByIndex(values, mode);
  }

  reconcileByIndex(values: ArraySet<TItem>, mode: 'set' | 'reset') {
    const current = [...this.items()];
    const commonLength = Math.min(current.length, values.length);
    for (let index = 0; index < commonLength; index++) {
      if (mode === 'reset') current[index]!.$api.reset(values[index]!);
      else current[index]!.$api.set(values[index]!);
    }
    while (current.length > values.length) this.detachItem(current.pop()!);
    while (current.length < values.length) {
      const item = this.createItem();
      item.$api.reset(values[current.length]!);
      current.push(item);
    }
    this.items.set(current);
    this.reparentItems();
  }

  reconcileByKey(values: ArraySet<TItem>, mode: 'set' | 'reset') {
    const trackBy = this.options!.trackBy!;
    const getTrackingKey = (value: NodeValue<TItem>, index: number): unknown => {
      if (typeof trackBy === 'function') return trackBy(value, index);
      return (value as Record<string, unknown>)[trackBy as string];
    };
    const remainingItemsByKey = this.indexItemsByKey(getTrackingKey);
    const incomingKeys = this.getIncomingKeys(values, getTrackingKey);
    const next = values.map((value, index) => {
      const key = incomingKeys[index]!;
      const existing = remainingItemsByKey.get(key);
      const item = existing ?? this.createItem();
      if (existing) remainingItemsByKey.delete(key);
      if (mode === 'reset' || !existing) item.$api.reset(value);
      else item.$api.set(value);
      return item;
    });
    remainingItemsByKey.forEach(item => this.detachItem(item));
    this.items.set(next);
    this.reparentItems();
  }

  indexItemsByKey(getTrackingKey: (value: NodeValue<TItem>, index: number) => unknown) {
    const current = [...this.items()];
    const currentByKey = new Map<unknown, TItem>();
    current.forEach((item, index) => {
      const key = getTrackingKey(item() as NodeValue<TItem>, index);
      if (currentByKey.has(key)) throw new Error(`array: duplicate trackBy key ${String(key)} in current items`);
      currentByKey.set(key, item);
    });
    return currentByKey;
  }

  getIncomingKeys(values: ArraySet<TItem>, getTrackingKey: (value: NodeValue<TItem>, index: number) => unknown) {
    const incomingKeys = new Set<unknown>();
    return values.map((value, index) => {
      const key = getTrackingKey(value as NodeValue<TItem>, index);
      if (incomingKeys.has(key)) throw new Error(`array: duplicate trackBy key ${String(key)} in incoming values`);
      incomingKeys.add(key);
      return key;
    });
  }

  normalizeArrayValue(value: ArraySet<TItem> | null | undefined): ArraySet<TItem> {
    return value ?? [];
  }

  readIndex(property: PropertyKey): number | null {
    if (typeof property !== 'string' || !/^(0|[1-9]\d*)$/.test(property)) return null;
    const index = Number(property);
    return Number.isSafeInteger(index) ? index : null;
  }

  createClone() {
    // Capture declarative inputs without retaining this instance or its parent tree.
    const { itemFactory, cloneInitial, initialValidatorSource, cloneOptions } = this;
    return () => new ArrayNode<TItem>(itemFactory, cloneInitial, initialValidatorSource, cloneOptions).getNode();
  }

  createNode(): ArrayNodeType<TItem> {
    const publicApi: ArrayApi<TItem> = {
      nodeType: () => 'array',
      items: this.items.asReadonly() as Signal<ArrayItems<TItem, Node>>,
      length: this.length,
      form: this.form,
      root: this.root,
      parent: this.parent.asReadonly(),
      path: this.path,
      keyInParent: this.keyInParent.asReadonly(),
      value: this.value,
      controlValue: this.controlValueBuffer.controlValue,
      at: index => this.items()[index] as ArrayItemNode<TItem> | undefined,
      forEach: callback => this.forEach(callback),
      map: callback => this.getItemSnapshot().map((item, index) => callback(item, index, this.node)),
      filter: ((predicate: Parameters<ArrayApi<TItem>['filter']>[0]) => this.filter(predicate)) as ArrayApi<TItem>['filter'],
      find: ((predicate: Parameters<ArrayApi<TItem>['find']>[0]) => this.find(predicate)) as ArrayApi<TItem>['find'],
      findIndex: predicate => this.getItemSnapshot().findIndex((item, index) => predicate(item, index, this.node)),
      some: predicate => this.getItemSnapshot().some((item, index) => predicate(item, index, this.node)),
      every: predicate => this.getItemSnapshot().every((item, index) => predicate(item, index, this.node)),
      includes: (item, fromIndex) => this.getItemSnapshot().includes(item as ArrayItemNode<TItem>, fromIndex),
      indexOf: (item, fromIndex) => this.getItemSnapshot().indexOf(item as ArrayItemNode<TItem>, fromIndex),
      push: (...args) => this.insert(this.items().length, ...args),
      insert: (index, ...args) => this.insert(index, ...args),
      removeAt: index => this.removeAt(index),
      moveUp: index => this.moveUp(index),
      moveDown: index => this.moveDown(index),
      move: (fromIndex, toIndex) => this.move(fromIndex, toIndex),
      swap: (firstIndex, secondIndex) => this.swap(firstIndex, secondIndex),
      clear: () => this.clear(),
      set: value => this.set(value),
      update: updater => untracked(() => this.set(updater(this.value()))),
      patch: value => this.patch(value),
      reset: (...args) => this.reset(...args),
      validators: this.validators.asReadonly(),
      setValidators: next => this.setValidators(next),
      errors: this.errors,
      allErrors: this.allErrors,
      valid: this.valid,
      invalid: this.invalid,
      getError: this.getError,
      required: this.required,
      pending: this.pending,
      submitting: this.submitting,
      debouncing: this.debouncing,
      flush: () => this.flush(),
      focus: (options?: FocusOptions) => this.getControlBindingForFocus()?.focus(options),
      validationStatus: this.validationStatus,
      touched: this.touched,
      untouched: this.untouched,
      markAsTouched: options => this.markAsTouched(options),
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
      [Symbol.iterator]: () => (this.items() as ArrayItems<TItem, Node>)[Symbol.iterator](),
    };

    const internalApi = {
      ...publicApi,
      _controlDebounce: this.controlDebounce,
      _controlValue: publicApi.controlValue,
      _setControlValue: (value: ArraySet<TItem> | null | undefined) => this.controlValueBuffer.set(this.normalizeArrayValue(value)),
      _flushControlValueOnBlur: publicApi.flush,
      _getSchemaSample: () => this.getSchemaSample(),
      _clone: this.createClone(),
      _setParent: (parent: Node | null, key?: string) => this.setParent(parent, key),
      _refreshInjector: () => this.refreshInjector(),
      _registerControlBinding: (binding: NodeControlBinding) => this.registerControlBinding(binding),
      _getControlBindingForFocus: () => this.getControlBindingForFocus(),
    };

    // defineProperties replaces the callable's built-in length with the public signal.
    const callableNode = Object.defineProperties(
      () => this.value(),
      Object.getOwnPropertyDescriptors({ ...publicApi, api: internalApi, $api: internalApi }),
    );

    return new Proxy(callableNode, {
      get: (target, property, receiver) => {
        const index = this.readIndex(property);
        return index === null ? Reflect.get(target, property, receiver) : this.items()[index];
      },
      has: (target, property) => {
        const index = this.readIndex(property);
        return index === null ? Reflect.has(target, property) : index < this.items().length;
      },
      set: (target, property, value, receiver) => {
        return this.readIndex(property) === null && Reflect.set(target, property, value, receiver);
      },
      deleteProperty: (target, property) => {
        return this.readIndex(property) === null && Reflect.deleteProperty(target, property);
      },
    }) as ArrayNodeType<TItem>;
  }
}
