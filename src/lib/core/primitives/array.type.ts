import type { Signal } from '@angular/core';

import type { Field } from './field.type';
import type { Form, FormOptions } from './form.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { MarkAsTouchedOptions, Node, NodeKeyInParent, NodePatch, NodeSet, NodeValue, RootNode } from '../types/node.type';
import type { ValidationError, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';

export type ArrayOptions<TValue = any> = FormOptions<TValue> & {
  /**
   * **Initial array contents.** Accepts either:
   *
   * - An array containing the initial value of every item.
   * - A non-negative integer specifying how many items to create from the template defaults.
   *
   * This option is available in the `array(template, options)` and
   * `array(template, validators, options)` signatures. When an initial value is supplied as a
   * positional argument, TypeScript intentionally omits this property to prevent two conflicting
   * initial-value sources.
   *
   * @defaultValue `[]`
   *
   * @example
   * `array(personTemplate, { initialValue: [{ name: 'Marco' }] })`
   *
   * @example
   * `array(personTemplate, { initialValue: 3 })`
   */
  readonly initialValue?: TValue | number;
  /**
   * Returns the stable identity of an item when `set()`, `update()`, or `reset(value)`
   * reconciles incoming values with the array's current nodes.
   *
   * Items with matching keys reuse and, when necessary, move their existing nodes. This
   * preserves node identity and state such as touched, dirty, and pending validation while
   * updating the node's value and path. New keys create nodes and removed keys detach nodes.
   *
   * Use a stable domain identifier such as `value.id` when values may be reordered or replaced
   * by new objects from a server. Every current and incoming item must return a unique key;
   * duplicate keys throw before the array is changed.
   *
   * When omitted, reconciliation is positional: existing nodes are reused by index. `move()`
   * can be used instead when the source and destination indexes are already known.
   *
   * @example
   * ```ts
   * array(personTemplate, initialPeople, {
   *   trackBy: person => person.id,
   * });
   * ```
   */
  readonly trackBy?: TValue extends readonly (infer TItemValue)[]
    ? (value: TItemValue, index: number) => unknown
    : never;
};

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
  /**
   * Property or array index under which this array is stored, or `null` when it is a root array.
   *
   * @example
   * `myForm.items.keyInParent()` returns `'items'`.
   *
   * @example
   * `myForm.items[0]?.keyInParent()` returns `0` for the first item.
   */
  keyInParent: Signal<NodeKeyInParent<TParent>>;
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
  /** Computes and sets the complete array value using the configured index or trackBy reconciliation. */
  update(updater: (value: ArrayValue<TItem>) => ArraySet<TItem>): void;
  patch(value: ArrayPatch<TItem>): void;
  reset(...args: [] | [value: ArraySet<TItem>]): void;
  validators: Signal<Validators<ArrayValue<TItem>>>;
  setValidators(validators: ValidatorSource<ArrayValue<TItem>>): void;
  /**
   * A signal containing the validation errors of **this array node itself, excluding its descendants**.
   *
   * ℹ️ To collect errors from the complete subtree, use `allErrors()` instead.
   */
  errors: Signal<readonly ValidationError.WithTargetNode<ArrayNode<TItem, TParent>>[]>;
  /**
   * A signal containing the validation errors of **this array node and its descendants**.
   *
   * ℹ️ To read only errors belonging directly to this array node, use `errors()` instead.
   */
  allErrors: Signal<readonly ValidationError.WithTargetNode<Node>[]>;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  /**
   * Returns the first validation error belonging directly to this array and matching `kind`.
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<ArrayNode<TItem, TParent>> & { readonly kind: TKind }) | undefined;
  required: Signal<boolean>;
  pending: Signal<boolean>;
  /** Whether this array or an ancestor form is currently running its submission action. */
  submitting: Signal<boolean>;
  /** Whether any current item descendant has a pending control-value debounce. */
  debouncing: Signal<boolean>;
  /** Immediately commits every pending control value in this array's current item subtrees. */
  flush(): void;
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
