import { computed, signal, type Injector, type Signal } from '@angular/core';

import type { Form } from './form';
import type { Field } from './field';
import { readMetadata } from '../metadata/metadata';
import { shallowEqual } from '../utils/shallow-equal';
import { isNode, markAsNode } from '../utils/node-marker';
import { computedFunction } from '../utils/computed-function';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { markAsFieldContext } from '../utils/field-context-marker';
import { form, type FormOptions, type NormalizedNode } from './form';
import { createNodeMetadata } from '../metadata/create-node-metadata';
import { runSyncValidators } from '../validation/run-sync-validators';
import { REQUIRED_METADATA } from '../validation/validators/required';
import { normalizeValidatorSource } from '../validation/validator-source';
import { createAsyncValidation } from '../validation/create-async-validation';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import { readStateSource, getInitialMutableState } from '../utils/read-state-source';
import { createNodeDefinitionFactory } from '../utils/create-node-definition-factory';
import { createReactiveWatch, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import type { ValidationError, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';
import type { InternalNode, MarkAsTouchedOptions, Node, NodeDefinition, NodePatch, NodeSet, NodeValue, RootNode } from '../types/node.type';

export type ArrayOptions<TValue = any> = FormOptions<TValue>;

export type ArrayItemWithParent<TItem extends Node, TParent extends Node> =
  TItem extends Field<infer TValue, Node> ? Field<TValue, TParent> :
  TItem extends Form<infer TNodes, Node> ? Form<TNodes, TParent> :
  TItem extends ArrayNode<infer TNestedItem, Node> ? ArrayNode<TNestedItem, TParent> : TItem;

export type ArrayValue<TItem extends Node> =
  TItem extends Form<infer TNodes, Node>
    ? { [K in keyof TNodes]: NodeValue<TNodes[K]> }[]
    : NodeValue<TItem>[];
export type ArraySet<TItem extends Node> = readonly NodeSet<TItem>[];
export type ArrayPatch<TItem extends Node> = readonly NodePatch<TItem>[];

export type ArrayRoot<TItem extends Node, TParent extends Node> = Node extends TParent
  ? ArrayNode<TItem, TParent>
  : RootNode<TParent>;

export type ArrayItems<TItem extends Node, TParent extends Node> =
  readonly ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>[];

export type ArrayIndexes<TItem extends Node, TParent extends Node> = {
  readonly [index: number]: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
};

export type ArrayApi<TItem extends Node, TParent extends Node = Node> = {
  /**
   * Readonly signal containing the array node's current item nodes.
   * Reading it participates in reactive tracking, and its array reference changes when the
   * structure changes. The contained nodes are the live nodes owned by this array, not clones.
   * Use spread syntax or Array.from() when a mutable copy of the node list is needed.
   */
  items: Signal<ArrayItems<TItem, TParent>>;
  length: Signal<number>;
  form: Signal<ArrayRoot<TItem, TParent>>;
  parent: Signal<TParent | null>;
  path: Signal<readonly string[]>;
  value: Signal<TItem extends Form<infer TNodes, Node> ? { [K in keyof TNodes]: NodeValue<TNodes[K]> }[] : NodeValue<TItem>[]>;
  at(index: number): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
  forEach(callback: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => void): void;
  map<TResult>(callback: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => TResult): TResult[];
  filter<TFiltered extends ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => item is TFiltered): TFiltered[];
  filter(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>[];
  find<TFound extends ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => item is TFound): TFound | undefined;
  find(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
  findIndex(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): number;
  some(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): boolean;
  every(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): boolean;
  includes(item: Node, fromIndex?: number): boolean;
  indexOf(item: Node, fromIndex?: number): number;
  [Symbol.iterator](): IterableIterator<ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>;
  push(...args: [] | [value: NodeSet<TItem>]): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>;
  insert(index: number, ...args: [] | [value: NodeSet<TItem>]): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>;
  removeAt(index: number): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
  move(fromIndex: number, toIndex: number): void;
  clear(): void;
  set(value: ArraySet<TItem>): void;
  patch(value: ArrayPatch<TItem>): void;
  reset(...args: [] | [value: ArraySet<TItem>]): void;
  validators: Signal<Validators<ArrayValue<TItem>>>;
  setValidators(validators: ValidatorSource<ArrayValue<TItem>>): void;
  errors: Signal<readonly ValidationError.WithTargetNode<ArrayNode<TItem, TParent>>[]>;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<ArrayNode<TItem, TParent>> & { readonly kind: TKind }) | undefined;
  required: Signal<boolean>;
  pending: Signal<boolean>;
  validationStatus: Signal<ValidationStatus>;
  touched: Signal<boolean>;
  untouched: Signal<boolean>;
  markAsTouched(options?: MarkAsTouchedOptions): void;
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

export type ArrayNode<TItem extends Node, TParent extends Node = Node> =
  & { (): TItem extends Form<infer TNodes, Node> ? { [K in keyof TNodes]: NodeValue<TNodes[K]> }[] : NodeValue<TItem>[]; api: ArrayApi<TItem, TParent> }
  & ArrayIndexes<TItem, TParent>
  & ArrayApi<TItem, TParent>
  & HiddenFunctionMembers<keyof ArrayApi<TItem, TParent>>;

type ArrayFactory<TDefinition extends NodeDefinition> = () => TDefinition;
type ArraySource<TDefinition extends NodeDefinition> = TDefinition | ArrayFactory<TDefinition>;
type ArrayInitial<TDefinition extends NodeDefinition> = number | ArraySet<NormalizedNode<TDefinition>>;
const looksLikeValidatorSource = (value: unknown): boolean =>
  typeof value === 'function'
  || (Array.isArray(value)
    && value.some((entry) => typeof entry === 'function')
    && value.every((entry) => entry == null || typeof entry === 'function'));

export function array<TDefinition extends NodeDefinition>(
  template: TDefinition,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
export function array<TDefinition extends NodeDefinition>(
  template: TDefinition,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
export function array<TDefinition extends NodeDefinition>(
  template: TDefinition,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
export function array<TDefinition extends NodeDefinition>(
  template: TDefinition,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
export function array<TDefinition extends NodeDefinition>(
  factory: ArrayFactory<TDefinition>,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
export function array<TDefinition extends NodeDefinition>(
  factory: ArrayFactory<TDefinition>,
  initial: NoInfer<ArrayInitial<TDefinition>>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
export function array<TDefinition extends NodeDefinition>(
  factory: ArrayFactory<TDefinition>,
  validators: ValidatorSource<NoInfer<ArrayValue<NormalizedNode<TDefinition>>>>,
  options?: ArrayOptions<ArrayValue<NormalizedNode<TDefinition>>>,
): ArrayNode<NormalizedNode<TDefinition>>;
export function array<TDefinition extends NodeDefinition>(
  factory: ArrayFactory<TDefinition>,
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
  const secondIsValidators = looksLikeValidatorSource(initialOrValidatorsOrOptions);
  const thirdIsValidators = looksLikeValidatorSource(validatorsOrOptions);
  const hasInitial = typeof initialOrValidatorsOrOptions === 'number'
    || (Array.isArray(initialOrValidatorsOrOptions) && (
      !secondIsValidators || thirdIsValidators || separateOptions !== undefined
    ));
  const initial = hasInitial ? initialOrValidatorsOrOptions as number | TSet : [] as TSet;
  const resolvedOptions = hasInitial
    ? thirdIsValidators ? separateOptions : validatorsOrOptions as ArrayOptions<TValue> | undefined
    : secondIsValidators ? validatorsOrOptions as ArrayOptions<TValue> | undefined : initialOrValidatorsOrOptions as ArrayOptions<TValue> | undefined;
  const validatorSource = hasInitial
    ? thirdIsValidators ? validatorsOrOptions as ValidatorSource<TValue> : resolvedOptions?.validators ?? []
    : secondIsValidators ? initialOrValidatorsOrOptions as ValidatorSource<TValue> : resolvedOptions?.validators ?? [];
  if (typeof initial === 'number' && (!Number.isSafeInteger(initial) || initial < 0)) {
    throw new RangeError('array: initial count must be a non-negative safe integer');
  }

  const factory = typeof source === 'function' && !isNode(source)
    ? source as ArrayFactory<TDefinition>
    : createNodeDefinitionFactory(source as TDefinition);
  const cloneOptions = resolvedOptions === undefined ? undefined : { ...resolvedOptions };
  const cloneInitial = typeof initial === 'number' ? initial : [...initial] as TSet;
  const recreateArray = array as unknown as (
    initialSource: ArrayFactory<TDefinition>,
    initialValue: number | TSet,
    initialValidators: ValidatorSource<TValue>,
    initialOptions?: ArrayOptions<TValue>,
  ) => ArrayNode<TItem>;
  const createdDefinitions = new WeakSet<object>();
  const trackDefinition = (definition: NodeDefinition): void => {
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
  const initialValues = typeof initial === 'number' ? null : [...initial];
  const initialCount = typeof initial === 'number' ? initial : initial.length;
  const initialItems = Array.from({ length: initialCount }, (_, index) => {
    const item = createItem();
    if (initialValues) item.api.reset(initialValues[index]!);
    return item;
  });
  const arrayItems = signal<readonly TItem[]>(initialItems);
  const arraySelfTouched = signal(false);
  const arraySelfDirty = signal(false);
  const arraySelfDisabled = signal(getInitialMutableState(resolvedOptions?.disabled));
  const arrayParent = signal<Node | null>(null);
  const arrayKeyInParent = signal<string | null>(null);
  const arrayPath = computed<readonly string[]>(() => {
    const parent = arrayParent();
    const key = arrayKeyInParent();
    return parent && key !== null ? [...parent.api.path(), key] : [];
  });
  const arrayDisabled = computed(() =>
    arraySelfDisabled() || readStateSource(resolvedOptions?.disabled) || arrayParent()?.api.disabled() === true,
  );
  const arraySelfReadonly = signal(getInitialMutableState(resolvedOptions?.readonly));
  const arrayReadonly = computed(() =>
    arraySelfReadonly() || readStateSource(resolvedOptions?.readonly) || arrayParent()?.api.readonly() === true,
  );
  const arraySelfHidden = signal(getInitialMutableState(resolvedOptions?.hidden));
  const arrayHidden = computed(() =>
    arraySelfHidden() || readStateSource(resolvedOptions?.hidden) || arrayParent()?.api.hidden() === true,
  );
  const arrayNonInteractive = computed(() => arrayHidden() || arrayDisabled() || arrayReadonly());
  const arrayValue = computed<TValue>(() => arrayItems().map((item) => item()) as TValue);
  const arrayContext = markAsFieldContext({ value: arrayValue });
  const arrayValidators = signal<Validators<TValue>>(normalizeValidatorSource(validatorSource));
  const emptySyncMetadata = new Map();
  let arrayNode!: ArrayNode<TItem>;
  const rootForm = computed(() => arrayParent()?.api.form() ?? arrayNode) as Signal<ArrayNode<TItem>>;
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
  const arrayErrors = computed(() => [...arraySyncErrors(), ...asyncValidation.errors()]);
  const getError = computedFunction(
    (kind: string) => arrayErrors().find((error) => error.kind === kind),
    { equal: shallowEqual, max: 20 },
  ) as ArrayApi<TItem>['getError'];
  const arrayPending = computed(() =>
    !arrayNonInteractive() && (
      asyncValidation.pending() || arrayItems().some((item) => item.api.pending())
    ),
  );
  const arrayValidationStatus = computed<ValidationStatus>(() => {
    if (arrayNonInteractive()) return 'valid';
    if (arrayErrors().length > 0 || arrayItems().some((item) => item.api.invalid())) return 'invalid';
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
    !arrayNonInteractive() && (arraySelfTouched() || arrayItems().some((item) => item.api.touched())),
  );
  const arrayDirty = computed(() =>
    !arrayNonInteractive() && (arraySelfDirty() || arrayItems().some((item) => item.api.dirty())),
  );
  const assertIndex = (index: number, allowEnd = false) => {
    const maximum = arrayItems().length - (allowEnd ? 0 : 1);
    if (!Number.isSafeInteger(index) || index < 0 || index > maximum) {
      throw new RangeError(`array: index ${index} is out of bounds`);
    }
  };
  const reparentItems = () => {
    arrayItems().forEach((item, index) => (item as InternalNode).api._setParent(arrayNode, String(index)));
  };
  const detachItem = (item: TItem) => (item as InternalNode).api._setParent(null);
  const insert = (index: number, ...args: [] | [value: NodeSet<TItem>]) => {
    assertIndex(index, true);
    const item = createItem();
    if (args.length === 1) item.api.reset(args[0]);
    const next = [...arrayItems()];
    next.splice(index, 0, item);
    arrayItems.set(next);
    reparentItems();
    arraySelfDirty.set(true);
    return item as ArrayItemWithParent<TItem, ArrayNode<TItem>>;
  };
  const removeAt = (index: number) => {
    if (!Number.isSafeInteger(index) || index < 0 || index >= arrayItems().length) return undefined;
    const next = [...arrayItems()];
    const [removed] = next.splice(index, 1);
    arrayItems.set(next);
    detachItem(removed!);
    reparentItems();
    arraySelfDirty.set(true);
    return removed as ArrayItemWithParent<TItem, ArrayNode<TItem>>;
  };
  const reconcile = (values: TSet, reset: boolean) => {
    const current = [...arrayItems()];
    const commonLength = Math.min(current.length, values.length);
    for (let index = 0; index < commonLength; index++) {
      if (reset) current[index]!.api.reset(values[index]!);
      else current[index]!.api.set(values[index]!);
    }
    while (current.length > values.length) detachItem(current.pop()!);
    while (current.length < values.length) {
      const item = createItem();
      item.api.reset(values[current.length]!);
      current.push(item);
    }
    arrayItems.set(current);
    reparentItems();
  };
  const reset = (...args: [] | [value: TSet]) => {
    if (args.length === 0) arrayItems().forEach((item) => item.api.reset());
    else reconcile(args[0], true);
    arraySelfTouched.set(false);
    arraySelfDirty.set(false);
  };
  const getItemSnapshot = () => [
    ...arrayItems(),
  ] as ArrayItemWithParent<TItem, ArrayNode<TItem>>[];
  const map: ArrayApi<TItem>['map'] = (callback) =>
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
  const findIndex: ArrayApi<TItem>['findIndex'] = (predicate) =>
    getItemSnapshot().findIndex((item, index) => predicate(item, index, arrayNode));
  const some: ArrayApi<TItem>['some'] = (predicate) =>
    getItemSnapshot().some((item, index) => predicate(item, index, arrayNode));
  const every: ArrayApi<TItem>['every'] = (predicate) =>
    getItemSnapshot().every((item, index) => predicate(item, index, arrayNode));
  const api: ArrayApi<TItem> = {
    items: arrayItems.asReadonly() as Signal<ArrayItems<TItem, Node>>,
    length: computed(() => arrayItems().length),
    form: rootForm,
    parent: arrayParent.asReadonly(),
    path: arrayPath,
    value: arrayValue,
    at: (index) => arrayItems()[index] as ArrayItemWithParent<TItem, ArrayNode<TItem>> | undefined,
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
    move: (fromIndex, toIndex) => {
      assertIndex(fromIndex);
      assertIndex(toIndex);
      if (fromIndex === toIndex) return;
      const next = [...arrayItems()];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item!);
      arrayItems.set(next);
      reparentItems();
      arraySelfDirty.set(true);
    },
    clear: () => {
      if (arrayItems().length === 0) return;
      arrayItems().forEach(detachItem);
      arrayItems.set([]);
      arraySelfDirty.set(true);
    },
    set: (value) => {
      reconcile(value, false);
      arraySelfDirty.set(true);
    },
    patch: (value) => {
      value.forEach((itemValue, index) => {
        const item = arrayItems()[index];
        if (item) item.api.patch(itemValue);
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
    valid: computed(() => arrayValidationStatus() === 'valid'),
    invalid: computed(() => arrayValidationStatus() === 'invalid'),
    getError,
    required: computed(() =>
      readMetadata(arrayMetadata(), REQUIRED_METADATA)
      || arrayErrors().some((error) => error.kind === 'required')
    ),
    pending: arrayPending,
    validationStatus: arrayValidationStatus,
    touched: arrayTouched,
    untouched: computed(() => !arrayTouched()),
    markAsTouched: (options) => {
      if (arrayNonInteractive()) return;
      arraySelfTouched.set(true);
      if (!options?.skipDescendants) arrayItems().forEach((item) => item.api.markAsTouched());
    },
    markAsUntouched: () => arraySelfTouched.set(false),
    dirty: arrayDirty,
    pristine: computed(() => !arrayDirty()),
    markAsDirty: () => {
      arraySelfDirty.set(true);
      arrayItems().forEach((item) => item.api.markAsDirty());
    },
    markAsPristine: () => {
      arraySelfDirty.set(false);
      arrayItems().forEach((item) => item.api.markAsPristine());
    },
    disabled: arrayDisabled,
    enabled: computed(() => !arrayDisabled()),
    disable: () => arraySelfDisabled.set(true),
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
    _clone: () => recreateArray(factory, cloneInitial, validatorSource, cloneOptions),
    _setParent: (parent: Node | null, key?: string) => {
      arrayParent.set(parent);
      arrayKeyInParent.set(parent ? key ?? null : null);
    },
  };
  const callableNode = Object.defineProperties(
    () => arrayValue(),
    Object.getOwnPropertyDescriptors({ ...api, api: internalApi }),
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
  ensureAsyncValidationWatch();
  return arrayNode;
}
