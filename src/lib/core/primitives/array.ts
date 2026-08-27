import { computed, signal, untracked, type Signal } from '@angular/core';

import { readMetadata } from '../metadata/metadata';
import { shallowEqual } from '../utils/shallow-equal';
import { isNode, markAsNode } from '../utils/node-marker';
import { computedFunction } from '../utils/computed-function';
import { createControlValueBuffer, type ControlValueBuffer } from '../utils/create-control-value-buffer';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { markAsFieldContext } from '../utils/field-context-marker';
import { form, type NormalizedNode } from './form';
import { createNodeMetadata } from '../metadata/create-node-metadata';
import { runSyncValidators } from '../validation/run-sync-validators';
import { registerNodeValidatorMessages } from '../validation/validator-messages';
import { REQUIRED_METADATA } from '../validation/validators/required';
import { normalizeValidatorSource } from '../validation/validator-source';
import { createAsyncValidation } from '../validation/create-async-validation';
import { readStateSource, getInitialMutableState } from '../utils/read-state-source';
import { createNodeDefinitionFactory } from '../utils/create-node-definition-factory';
import { createReactiveWatch, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import type { ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';
import { firstControlBindingInDom, findFirstControlBindingInDom } from '../utils/node-control-binding';
import type { InternalNode, Node, NodeControlBinding, NodeDefinition, NodeSet, NodeValue } from '../types/node.type';
import { notifyExternalValidationReset, readExternalValidationErrors } from '../validation/external-validation-errors';
import type { ArrayApi, ArrayItemWithParent, ArrayItems, ArrayNode, ArrayOptions, ArraySet, ArrayValue } from './array.type';
import { createDisabledReason, getInitialDisabledState, readConfiguredDisabledState, type DisabledState } from '../utils/disabled-reasons';

export type { ArrayApi, ArrayIndexes, ArrayItemWithParent, ArrayItems, ArrayNode, ArrayOptions, ArrayPatch, ArrayRoot, ArraySet, ArrayValue } from './array.type';
type ArrayFactory<TDefinition extends NodeDefinition> = () => TDefinition;
type ArraySource<TDefinition extends NodeDefinition> = TDefinition | ArrayFactory<TDefinition>;
type ArrayInitial<TDefinition extends NodeDefinition> = number | ArraySet<NormalizedNode<TDefinition>> | null | undefined;
type PositionalArrayOptions<TValue> = Omit<ArrayOptions<TValue>, 'initialValue'>;
const omitInitialValue = <TValue>(options: ArrayOptions<TValue>): PositionalArrayOptions<TValue> => {
  const { initialValue: _initialValue, ...remainingOptions } = options;
  return remainingOptions;
};
const looksLikeValidatorSource = (value: unknown): boolean =>
  typeof value === 'function'
  || (Array.isArray(value)
    && value.some(entry => typeof entry === 'function')
    && value.every(entry => entry === null || entry === undefined || typeof entry === 'function'));

/**
 * Creates an array node from a declarative node template.
 *
 * **Template with initial value**
 * 
 * ```ts
 * const people = array({
 *   name: field(''), 
 *   age: field(0) 
 * }, [
 *   { name: 'Marco', age: 30 },
 *   { name: 'Tom', age: 22 }
 * ]);
 * ```
 * 
 * **Template with initial amount of values**
 * ```ts
 * const people = array({
 *   name: field(''), 
 *   age: field(0) 
 * }, 2);
 * ```
 * 
 * **Primitive field template**
 * ```ts
 * const tags = array(field(''), ['angular', 'signals']);
 * ```
 * 
 * **Template with options**
 * ```ts
 * const people = array({
 *   name: field(''), 
 *   age: field(0) 
 * }, {
 *   initialValue: [{ name: 'Marco', age: 30 }],
 *   validators: [minLength(1)],
 *   trackBy: item => item.name,
 * });
 * ```
 * 
 * **Factory with options**
 * ```ts
 * const people = array(() => ({
 *   name: field(''), 
 *   age: field(0) 
 * }), {
 *   validators: [minLength(1)],
 * });
 * ```
 * 
 * @param template Declarative shape cloned for every item. Pass a `field()`, `form()`, nested
 * `array()`, or shorthand object. The supplied definition remains an independent node and is not
 * inserted directly into this array.
 * @param options Array configuration. `initialValue` accepts either an array of item values or a non-negative initial item count; it defaults to `[]`.
 */
export function array<TDefinition extends NodeDefinition>(
  template: TDefinition,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a declarative node template and positional initial contents.
 *
 * @param template Declarative shape cloned for every item. Pass a `field()`, `form()`, nested
 * `array()`, or shorthand object; the supplied definition itself is not inserted into the array.
 * @param initial **Initial contents:** either an array of item values or a non-negative integer specifying how many items to create from the template defaults.
 * @param options Additional array configuration.
 */
export function array<TDefinition extends NodeDefinition>(
  template: TDefinition,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  options?: PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a template, positional initial contents, and validators.
 *
 * @param template Declarative shape cloned for every item. Pass a `field()`, `form()`, nested
 * `array()`, or shorthand object; the supplied definition itself is not inserted into the array.
 * @param initial **Initial contents:** either an array of item values or a non-negative integer specifying how many items to create from the template defaults.
 * @param validators Reactive validator source for the complete array value.
 * @param options Additional array configuration.
 */
export function array<TDefinition extends NodeDefinition>(
  template: TDefinition,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>>,
  options?: PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a template and validators.
 *
 * @param template Declarative shape cloned for every item. Pass a `field()`, `form()`, nested
 * `array()`, or shorthand object; the supplied definition itself is not inserted into the array.
 * @param validators Reactive validator source for the complete array value.
 * @param options Array configuration. `initialValue` accepts either an array of item values or a non-negative initial item count.
 */
export function array<TDefinition extends NodeDefinition>(
  template: TDefinition,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a node-definition factory.
 *
 * @example Factory returning a fresh shorthand form definition for every item.
 * ```ts
 * const people = array(
 *   () => ({ name: field(''), age: field(0) }),
 *   2,
 * );
 * ```
 *
 * @param factory Creates the declarative shape for each item. Use a factory when construction
 * should be deferred or customized. Every call must return a fresh `field()`, `form()`, `array()`,
 * or shorthand object; returning the same definition twice throws.
 * @param options Array configuration. `initialValue` accepts either an array of item values or a non-negative initial item count; it defaults to `[]`.
 */
export function array<TDefinition extends NodeDefinition>(
  factory: ArrayFactory<TDefinition>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a factory and positional initial contents.
 *
 * @param factory Creates one fresh `field()`, `form()`, `array()`, or shorthand object per item.
 * Returning the same definition from multiple calls throws.
 * @param initial **Initial contents:** either an array of item values or a non-negative integer specifying how many items to create from the factory defaults.
 * @param options Additional array configuration.
 */
export function array<TDefinition extends NodeDefinition>(
  factory: ArrayFactory<TDefinition>,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  options?: PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a factory, positional initial contents, and validators.
 *
 * @param factory Creates one fresh `field()`, `form()`, `array()`, or shorthand object per item.
 * Returning the same definition from multiple calls throws.
 * @param initial **Initial contents:** either an array of item values or a non-negative integer specifying how many items to create from the factory defaults.
 * @param validators Reactive validator source for the complete array value.
 * @param options Additional array configuration.
 */
export function array<TDefinition extends NodeDefinition>(
  factory: ArrayFactory<TDefinition>,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>>,
  options?: PositionalArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
/**
 * Creates an array node from a factory and validators.
 *
 * @param factory Creates one fresh `field()`, `form()`, `array()`, or shorthand object per item.
 * Returning the same definition from multiple calls throws.
 * @param validators Reactive validator source for the complete array value.
 * @param options Array configuration. `initialValue` accepts either an array of item values or a non-negative initial item count.
 */
export function array<TDefinition extends NodeDefinition>(
  factory: ArrayFactory<TDefinition>,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
export function array<TDefinition extends NodeDefinition>(
  source: ArraySource<TDefinition>,
  initialOrValidatorsOrOptions?: ArrayInitial<TDefinition> | ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>> | ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
  validatorsOrOptions?: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>> | ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
  separateOptions?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>> {
  type TItem = NormalizedNode<TDefinition>;
  type TValue = ArrayValue<TItem>;
  type TSet = ArraySet<TItem>;
  type TInput = TSet | null | undefined;
  const secondIsValidators = looksLikeValidatorSource(initialOrValidatorsOrOptions);
  const thirdIsValidators = looksLikeValidatorSource(validatorsOrOptions);
  const hasInitial = initialOrValidatorsOrOptions === null
    || typeof initialOrValidatorsOrOptions === 'number'
    || (Array.isArray(initialOrValidatorsOrOptions) && (
      !secondIsValidators || thirdIsValidators || separateOptions !== undefined
    ));
  const resolvedOptions = hasInitial
    ? thirdIsValidators ? separateOptions : validatorsOrOptions as ArrayOptions<TValue> | undefined
    : secondIsValidators ? validatorsOrOptions as ArrayOptions<TValue> | undefined : initialOrValidatorsOrOptions as ArrayOptions<TValue> | undefined;
  const configuredInitial = resolvedOptions?.initialValue;
  const initial = hasInitial
    ? initialOrValidatorsOrOptions as number | TSet | null
    : configuredInitial as number | TSet | null | undefined;
  const validatorSource = hasInitial
    ? thirdIsValidators ? validatorsOrOptions as ValidatorSource<TValue> : resolvedOptions?.validators ?? []
    : secondIsValidators ? initialOrValidatorsOrOptions as ValidatorSource<TValue> : resolvedOptions?.validators ?? [];
  if (typeof initial === 'number' && (!Number.isSafeInteger(initial) || initial < 0)) {
    throw new RangeError('array: initial count must be a non-negative safe integer');
  }
  const normalizedInitial = initial ?? [];

  const factory = typeof source === 'function' && !isNode(source)
    ? source as ArrayFactory<TDefinition>
    : createNodeDefinitionFactory(source as TDefinition);
  const cloneOptions = resolvedOptions === undefined ? undefined : omitInitialValue(resolvedOptions);
  const cloneInitial = typeof normalizedInitial === 'number' ? normalizedInitial : [...normalizedInitial] as TSet;
  const recreateArray = array as unknown as (
    initialSource: ArrayFactory<TDefinition>,
    initialValue: number | TSet,
    initialValidators: ValidatorSource<TValue>,
    initialOptions?: ArrayOptions<TValue>,
  ) => ArrayNode<TItem>;
  const createdDefinitions = new WeakSet<object>();
  const trackDefinition = (definition: NodeDefinition) => {
    if (createdDefinitions.has(definition)) {
      throw new Error('array: factory must return a fresh node definition for every item');
    }
    createdDefinitions.add(definition);
    if (!isNode(definition)) (Object.values(definition) as NodeDefinition[]).forEach(trackDefinition);
  };
  const createItem = (): TItem => {
    const definition = factory();
    trackDefinition(definition);
    return (isNode(definition) ? definition : form(definition)) as TItem;
  };
  const initialValues = typeof normalizedInitial === 'number' ? null : [...normalizedInitial];
  const initialCount = typeof normalizedInitial === 'number' ? normalizedInitial : normalizedInitial.length;
  const initialItems = Array.from({ length: initialCount }, (_, index) => {
    const item = createItem();
    if (initialValues) item.$api.reset(initialValues[index]!);
    return item;
  });
  const arrayItems = signal<readonly TItem[]>(initialItems);
  const arraySelfTouched = signal(false);
  const arraySelfDirty = signal(false);
  const arrayControlBindings = new Set<NodeControlBinding>();
  const arraySelfDisabled = signal<DisabledState>(getInitialDisabledState(resolvedOptions?.disabled));
  const arrayParent = signal<Node | null>(null);
  const arrayKeyInParent = signal<string | number | null>(null);
  const arrayControlDebounce = computed(() =>
    resolvedOptions?.debounce
    ?? (arrayParent() as InternalNode | null)?.$api._controlDebounce(),
  );
  const arrayPath = computed<readonly string[]>(() => {
    const parent = arrayParent();
    const key = arrayKeyInParent();
    return parent && key !== null ? [...parent.$api.path(), String(key)] : [];
  });
  // eslint-disable-next-line prefer-const -- Assigned after self-referencing computed state has been declared.
  let arrayNode!: ArrayNode<TItem>;
  const arrayOwnDisabledReason = computed(() => createDisabledReason(arraySelfDisabled(), arrayNode), { equal: shallowEqual });
  const arrayConfiguredDisabledReason = computed(
    () => createDisabledReason(readConfiguredDisabledState(resolvedOptions?.disabled), arrayNode),
    { equal: shallowEqual },
  );
  const arrayDisabledReasons = computed(() => [
    ...(arrayParent()?.$api.disabledReasons() ?? []),
    ...[arrayOwnDisabledReason(), arrayConfiguredDisabledReason()].filter(reason => reason !== undefined),
  ], { equal: shallowEqual });
  const arrayDisabled = computed(() => arrayDisabledReasons().length > 0);
  const arraySelfReadonly = signal(getInitialMutableState(resolvedOptions?.readonly));
  const arrayReadonly = computed(() =>
    arraySelfReadonly() || readStateSource(resolvedOptions?.readonly) || arrayParent()?.$api.readonly() === true,
  );
  const arraySelfHidden = signal(getInitialMutableState(resolvedOptions?.hidden));
  const arrayHidden = computed(() =>
    arraySelfHidden() || readStateSource(resolvedOptions?.hidden) || arrayParent()?.$api.hidden() === true,
  );
  const arrayNonInteractive = computed(() => arrayHidden() || arrayDisabled() || arrayReadonly());
  const arrayValue = computed<TValue>(() => arrayItems().map(item => item()) as TValue);
  const arrayContext = markAsFieldContext({ value: arrayValue });
  const arrayValidators = signal<Validators<TValue>>(normalizeValidatorSource(validatorSource));
  const emptySyncMetadata = new Map();
  const rootForm = computed(() => arrayParent()?.$api.form() ?? arrayNode) as Signal<ArrayNode<TItem>>;
  const arraySyncValidation = computed(() => arrayNonInteractive()
    ? { errors: [], metadata: emptySyncMetadata }
    : runSyncValidators(arrayContext, arrayValidators(), arrayNode));
  const arraySyncErrors = computed(() => arraySyncValidation().errors);
  const arrayMetadata = createNodeMetadata(arrayValidators, computed(() => arraySyncValidation().metadata));
  const asyncValidation = createAsyncValidation(
    arrayContext,
    arrayValidators,
    arraySyncErrors,
    () => arrayNode,
    () => !arrayNonInteractive(),
  );
  const arrayControlErrors = computed(() => arrayNonInteractive()
    ? []
    : readExternalValidationErrors(arrayNode));
  const arrayErrors = computed(() => [...arraySyncErrors(), ...asyncValidation.errors(), ...arrayControlErrors()]);
  const arrayAllErrors = computed(
    () => [
      ...arrayErrors(),
      ...arrayItems().flatMap(item => item.$api.allErrors()),
    ],
    { equal: shallowEqual },
  );
  const getError = computedFunction(
    (kind: string) => arrayErrors().find(error => error.kind === kind),
    { equal: shallowEqual, max: 20 },
  ) as ArrayApi<TItem>['getError'];
  const arrayPending = computed(() =>
    !arrayNonInteractive() && (
      asyncValidation.pending() || arrayItems().some(item => item.$api.pending())
    ),
  );
  const arrayValidationStatus = computed<ValidationStatus>(() => {
    if (arrayNonInteractive()) return 'valid';
    if (arrayErrors().length > 0 || arrayItems().some(item => item.$api.invalid())) return 'invalid';
    if (arrayPending()) return 'unknown';
    return 'valid';
  });
  let asyncValidationWatchTarget: ReactiveWatchTarget | null = null;
  const ensureAsyncValidationWatch = () => {
    if (asyncValidationWatchTarget || !arrayValidators().some(isAsyncValidator)) return;
    asyncValidationWatchTarget = { run: asyncValidation.validate, cleanup: asyncValidation.cancel, destroy: asyncValidation.destroy };
    createReactiveWatch(asyncValidationWatchTarget, resolvedOptions?.injector);
  };
  const arrayTouched = computed(() =>
    !arrayNonInteractive() && (arraySelfTouched() || arrayItems().some(item => item.$api.touched())),
  );
  const arrayDirty = computed(() =>
    !arrayNonInteractive() && (arraySelfDirty() || arrayItems().some(item => item.$api.dirty())),
  );
  // eslint-disable-next-line prefer-const -- Assigned after computed state that reads the buffer has been declared.
  let arrayControlValueBuffer!: ControlValueBuffer<TValue, TSet>;
  const arrayDebouncing = computed(() =>
    arrayControlValueBuffer.debouncing()
    || arrayItems().some(item => item.$api.debouncing()),
  );
  const assertIndex = (index: number, allowEnd = false) => {
    const maximum = arrayItems().length - (allowEnd ? 0 : 1);
    if (!Number.isSafeInteger(index) || index < 0 || index > maximum) {
      throw new RangeError(`array: index ${index} is out of bounds`);
    }
  };
  const reparentItems = () => {
    arrayItems().forEach((item, index) => (item as InternalNode).$api._setParent(arrayNode, index));
  };
  const detachItem = (item: TItem) => (item as InternalNode).$api._setParent(null);
  const insert = (index: number, ...args: [] | [value: NodeSet<TItem>]) => {
    assertIndex(index, true);
    const item = createItem();
    if (args.length === 1) item.$api.reset(args[0]);
    const next = [...arrayItems()];
    next.splice(index, 0, item);
    arrayItems.set(next);
    reparentItems();
    return item as ArrayItemWithParent<TItem, ArrayNode<TItem>>;
  };
  const removeAt = (index: number) => {
    if (!Number.isSafeInteger(index) || index < 0 || index >= arrayItems().length) return undefined;
    const next = [...arrayItems()];
    const [removed] = next.splice(index, 1);
    arrayItems.set(next);
    detachItem(removed!);
    reparentItems();
    return removed as ArrayItemWithParent<TItem, ArrayNode<TItem>>;
  };
  const move = (fromIndex: number, toIndex: number) => {
    assertIndex(fromIndex);
    assertIndex(toIndex);
    if (fromIndex === toIndex) return;
    const next = [...arrayItems()];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item!);
    arrayItems.set(next);
    reparentItems();
  };
  const reconcileByIndex = (values: TSet, reset: boolean) => {
    const current = [...arrayItems()];
    const commonLength = Math.min(current.length, values.length);
    for (let index = 0; index < commonLength; index++) {
      if (reset) current[index]!.$api.reset(values[index]!);
      else current[index]!.$api.set(values[index]!);
    }
    while (current.length > values.length) detachItem(current.pop()!);
    while (current.length < values.length) {
      const item = createItem();
      item.$api.reset(values[current.length]!);
      current.push(item);
    }
    arrayItems.set(current);
    reparentItems();
  };
  const reconcileByKey = (values: TSet, reset: boolean) => {
    const trackBy = resolvedOptions!.trackBy!;
    const getTrackingKey = (value: NodeValue<TItem>, index: number): unknown => {
      if (typeof trackBy === 'function') return trackBy(value, index);
      return (value as Record<string, unknown>)[trackBy as string];
    };
    const current = [...arrayItems()];
    const currentByKey = new Map<unknown, TItem>();
    current.forEach((item, index) => {
      const key = getTrackingKey(item() as NodeValue<TItem>, index);
      if (currentByKey.has(key)) throw new Error(`array: duplicate trackBy key ${String(key)} in current items`);
      currentByKey.set(key, item);
    });
    const incomingKeys = new Set<unknown>();
    const keys = values.map((value, index) => {
      const key = getTrackingKey(value as NodeValue<TItem>, index);
      if (incomingKeys.has(key)) throw new Error(`array: duplicate trackBy key ${String(key)} in incoming values`);
      incomingKeys.add(key);
      return key;
    });
    const next = values.map((value, index) => {
      const existing = currentByKey.get(keys[index]!);
      const item = existing ?? createItem();
      if (existing) currentByKey.delete(keys[index]!);
      if (reset || !existing) item.$api.reset(value);
      else item.$api.set(value);
      return item;
    });
    currentByKey.forEach(detachItem);
    arrayItems.set(next);
    reparentItems();
  };
  const reconcile = resolvedOptions?.trackBy !== undefined ? reconcileByKey : reconcileByIndex;
  const normalizeArrayValue = (value: TInput): TSet => {
    return value ?? [];
  };
  const reset = (...args: [] | [value: TInput]) => {
    arrayControlValueBuffer?.cancel();
    if (args.length === 0) arrayItems().forEach(item => item.$api.reset());
    else reconcile(normalizeArrayValue(args[0]), true);
    arraySelfTouched.set(false);
    arraySelfDirty.set(false);
    notifyExternalValidationReset(arrayNode);
  };
  const getControlBindingForFocus = () => {
    const own = findFirstControlBindingInDom(arrayControlBindings);
    if (own) return own;
    return arrayItems()
      .map(item => (item as InternalNode).$api._getControlBindingForFocus())
      .reduce(firstControlBindingInDom, undefined);
  };
  const getItemSnapshot = () => [
    ...arrayItems(),
  ] as ArrayItemWithParent<TItem, ArrayNode<TItem>>[];
  const map: ArrayApi<TItem>['map'] = callback =>
    getItemSnapshot().map((item, index) => callback(item, index, arrayNode));
  const filter = ((predicate: (
    item: ArrayItemWithParent<TItem, ArrayNode<TItem>>,
    index: number,
    array: ArrayNode<TItem>,
  ) => unknown) =>
    getItemSnapshot().filter((item, index) => predicate(item, index, arrayNode))) as ArrayApi<TItem>['filter'];
  const find = ((predicate: (
    item: ArrayItemWithParent<TItem, ArrayNode<TItem>>,
    index: number,
    array: ArrayNode<TItem>,
  ) => unknown) =>
    getItemSnapshot().find((item, index) => predicate(item, index, arrayNode))) as ArrayApi<TItem>['find'];
  const findIndex: ArrayApi<TItem>['findIndex'] = predicate =>
    getItemSnapshot().findIndex((item, index) => predicate(item, index, arrayNode));
  const some: ArrayApi<TItem>['some'] = predicate =>
    getItemSnapshot().some((item, index) => predicate(item, index, arrayNode));
  const every: ArrayApi<TItem>['every'] = predicate =>
    getItemSnapshot().every((item, index) => predicate(item, index, arrayNode));
  const set = (value: TInput) => {
    arrayControlValueBuffer?.cancel();
    reconcile(normalizeArrayValue(value), false);
  };
  arrayControlValueBuffer = createControlValueBuffer(
    arrayValue,
    arrayControlDebounce,
    set,
    () => arraySelfDirty.set(true),
  );
  const api: ArrayApi<TItem> = {
    items: arrayItems.asReadonly() as Signal<ArrayItems<TItem, Node>>,
    length: computed(() => arrayItems().length),
    form: rootForm,
    parent: arrayParent.asReadonly(),
    path: arrayPath,
    keyInParent: arrayKeyInParent.asReadonly(),
    value: arrayValue,
    controlValue: arrayControlValueBuffer.controlValue,
    at: index => arrayItems()[index] as ArrayItemWithParent<TItem, ArrayNode<TItem>> | undefined,
    forEach: (callback) => {
      const snapshot = arrayItems();
      snapshot.forEach((item, index) => callback(
        item as ArrayItemWithParent<TItem, ArrayNode<TItem>>,
        index,
        arrayNode,
      ));
    },
    map,
    filter,
    find,
    findIndex,
    some,
    every,
    includes: (item, fromIndex) => getItemSnapshot().includes(item as ArrayItemWithParent<TItem, ArrayNode<TItem>>, fromIndex),
    indexOf: (item, fromIndex) => getItemSnapshot().indexOf(item as ArrayItemWithParent<TItem, ArrayNode<TItem>>, fromIndex),
    [Symbol.iterator]: () => (
      arrayItems() as ArrayItems<TItem, Node>
    )[Symbol.iterator](),
    push: (...args) => insert(arrayItems().length, ...args),
    insert,
    removeAt,
    moveUp: (index) => {
      assertIndex(index);
      if (index > 0) move(index, index - 1);
    },
    moveDown: (index) => {
      assertIndex(index);
      if (index < arrayItems().length - 1) move(index, index + 1);
    },
    move,
    swap: (firstIndex, secondIndex) => {
      assertIndex(firstIndex);
      assertIndex(secondIndex);
      if (firstIndex === secondIndex) return;
      const next = [...arrayItems()];
      [next[firstIndex], next[secondIndex]] = [next[secondIndex]!, next[firstIndex]!];
      arrayItems.set(next);
      reparentItems();
    },
    clear: () => {
      if (arrayItems().length === 0) return;
      arrayItems().forEach(detachItem);
      arrayItems.set([]);
    },
    set,
    update: updater => untracked(() => set(updater(arrayValue()))),
    patch: (value) => {
      arrayControlValueBuffer.cancel();
      value.forEach((itemValue, index) => {
        const item = arrayItems()[index];
        if (item) item.$api.patch(itemValue);
        else console.warn(`array: unknown index ${index} ignored on patch`);
      });
    },
    reset,
    validators: arrayValidators.asReadonly(),
    setValidators: (next) => {
      arrayValidators.set(normalizeValidatorSource(next));
      ensureAsyncValidationWatch();
    },
    errors: arrayErrors,
    allErrors: arrayAllErrors,
    valid: computed(() => arrayValidationStatus() === 'valid'),
    invalid: computed(() => arrayValidationStatus() === 'invalid'),
    getError,
    required: computed(() =>
      readMetadata(arrayMetadata(), REQUIRED_METADATA)
      || arrayErrors().some(error => error.kind === 'required')
    ),
    pending: arrayPending,
    submitting: computed(() => arrayParent()?.$api.submitting() === true),
    debouncing: arrayDebouncing,
    flush: () => {
      arrayControlValueBuffer.flush();
      arrayItems().forEach(item => item.$api.flush());
    },
    focus: (options?: FocusOptions) => getControlBindingForFocus()?.focus(options),
    validationStatus: arrayValidationStatus,
    touched: arrayTouched,
    untouched: computed(() => !arrayTouched()),
    markAsTouched: (options) => {
      if (arrayNonInteractive()) return;
      arraySelfTouched.set(true);
      arrayControlValueBuffer.flush();
      if (!options?.skipDescendants) arrayItems().forEach(item => item.$api.markAsTouched());
    },
    markAsUntouched: () => arraySelfTouched.set(false),
    dirty: arrayDirty,
    pristine: computed(() => !arrayDirty()),
    markAsDirty: () => arraySelfDirty.set(true),
    markAsPristine: () => arraySelfDirty.set(false),
    disabled: arrayDisabled,
    disabledReasons: arrayDisabledReasons,
    enabled: computed(() => !arrayDisabled()),
    disable: (message?: string) => arraySelfDisabled.set(message ?? true),
    enable: () => arraySelfDisabled.set(false),
    readonly: arrayReadonly,
    writable: computed(() => !arrayReadonly()),
    markAsReadonly: () => arraySelfReadonly.set(true),
    markAsWritable: () => arraySelfReadonly.set(false),
    hidden: arrayHidden,
    visible: computed(() => !arrayHidden()),
    hide: () => arraySelfHidden.set(true),
    show: () => arraySelfHidden.set(false),
  };
  const internalApi = {
    ...api,
    _controlDebounce: arrayControlDebounce,
    _controlValue: api.controlValue,
    _setControlValue: (value: TInput) => arrayControlValueBuffer.set(normalizeArrayValue(value)),
    _flushControlValueOnBlur: api.flush,
    _clone: () => recreateArray(factory, cloneInitial, validatorSource, cloneOptions),
    _setParent: (parent: Node | null, key?: string) => {
      arrayParent.set(parent);
      arrayKeyInParent.set(parent ? key ?? null : null);
    },
    _registerControlBinding: (binding: NodeControlBinding) => {
      arrayControlBindings.add(binding);
      return () => { arrayControlBindings.delete(binding); };
    },
    _getControlBindingForFocus: getControlBindingForFocus,
  };
  const callableNode = Object.defineProperties(
    () => arrayValue(),
    Object.getOwnPropertyDescriptors({ ...api, api: internalApi, $api: internalApi }),
  );
  const readIndex = (property: PropertyKey): number | null => {
    if (typeof property !== 'string' || !/^(0|[1-9]\d*)$/.test(property)) return null;
    const index = Number(property);
    return Number.isSafeInteger(index) ? index : null;
  };
  arrayNode = new Proxy(callableNode, {
    get: (target, property, receiver) => {
      const index = readIndex(property);
      return index === null ? Reflect.get(target, property, receiver) : arrayItems()[index];
    },
    has: (target, property) => {
      const index = readIndex(property);
      return index === null ? Reflect.has(target, property) : index < arrayItems().length;
    },
    set: (target, property, value, receiver) =>
      readIndex(property) === null && Reflect.set(target, property, value, receiver),
    deleteProperty: (target, property) =>
      readIndex(property) === null && Reflect.deleteProperty(target, property),
  }) as ArrayNode<TItem>;
  reparentItems();
  markAsNode(arrayNode);
  registerNodeValidatorMessages(arrayNode, resolvedOptions?.validatorMessages, resolvedOptions?.injector);
  ensureAsyncValidationWatch();
  return arrayNode;
}
