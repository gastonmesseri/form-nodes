import type { Signal } from '@angular/core';

import type { Field } from './field.type';
import type { Group } from './group.type';
import type { Form, FormOptions } from './form.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { DisabledReason, Node, NodeKeyInParent, NodePatch, NodeSet, NodeValue, RootNode } from '../types/node.type';
import type { CustomValidationError, ValidationError, ValidationErrorMap, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';

export type ArrayOptions<TValue = any> = Omit<FormOptions<TValue>, 'submission' | 'validators' | 'hidden' | 'disabled' | 'readonly'> & {
  /**
   * One validator or an array of validators for the complete array value, not each item.
   *
   * @example Validate the collection with one built-in validator.
   * ```ts
   * array(field(''), {
   *   validators: minLength(1),
   * });
   * ```
   *
   * @example Combine collection validators.
   * ```ts
   * array(field(''), {
   *   validators: [minLength(1), uniqueItems],
   * });
   * ```
   *
   * @example Declare a custom collection rule inline.
   * ```ts
   * array(field(0), {
   *   validators: ({ value }) => {
   *     return value().some(amount => amount !== null && amount < 0)
   *       ? { kind: 'negativeAmount', message: 'Amounts cannot be negative.' }
   *       : null;
   *   },
   * });
   * ```
   *
   * @example Add one asynchronous collection validator.
   * ```ts
   * array(field(''), {
   *   validators: asyncValidator(async ({ value }) => {
   *     const allowed = await areTagsAllowed(value());
   *     return allowed ? null : { kind: 'tagsNotAllowed' };
   *   }),
   * });
   * ```
   *
   * Put validators in the item template when every item should be validated independently.
   */
  validators?: ValidatorSource<TValue>;
  /**
   * Initial or reactive visibility of the complete collection.
   *
   * @example Create a collection that starts hidden.
   * ```ts
   * array(field(''), { hidden: true });
   * ```
   *
   * @example Hide contact rows when the user opts out of providing contacts.
   * ```ts
   * array(field(''), {
   *   hidden: () => !collectContacts(),
   * });
   * ```
   */
  hidden?: boolean | (() => boolean);
  /**
   * Initial or reactive disabled state for the collection and its items. Return a string to record
   * a user-facing reason.
   *
   * @example Create a collection that starts disabled.
   * ```ts
   * array(orderLineTemplate, { disabled: 'Order lines are managed externally.' });
   * ```
   *
   * @example Lock order lines after the order is submitted.
   * ```ts
   * array(orderLineTemplate, {
   *   disabled: () => orderSubmitted() ? 'The order has already been submitted.' : false,
   * });
   * ```
   */
  disabled?: boolean | string | (() => boolean | string);
  /**
   * Initial or reactive readonly state for the collection and its items.
   *
   * @example Create a collection that starts in readonly mode.
   * ```ts
   * array(auditEntryTemplate, { readonly: true });
   * ```
   *
   * @example Show audit entries without allowing them to be edited.
   * ```ts
   * array(auditEntryTemplate, {
   *   readonly: () => auditFinalized(),
   * });
   * ```
   */
  readonly?: boolean | (() => boolean);
  /**
   * **Initial array contents.** Accepts either:
   *
   * - An array containing the initial value of every item.
   * - A non-negative integer specifying how many items to create from the template defaults.
   *
   * ℹ️ `null` and `undefined` normalize to `[]`; the observable array value itself is never
   * nullable. Individual item values may still be nullable when their templates allow it.
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
  initialValue?: TValue | number | null;
  /**
   * Selects the stable identity of an item when `set()`, `update()`, or `reset(value)` reconciles
   * incoming values with the array's current nodes. Pass either a typed property name such as
   * `'id'` or a callback for computed or non-property keys.
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
   *   trackBy: 'id',
   * });
   * ```
   *
   * @example
   * ```ts
   * array(personTemplate, initialPeople, {
   *   trackBy: person => person.id,
   * });
   * ```
  */
  trackBy?: TValue extends readonly (infer TItemValue)[]
    ? ((value: TItemValue, index: number) => unknown)
      | (TItemValue extends object ? Extract<keyof TItemValue, string> : never)
    : never;
};

export type ArrayItemWithParent<TItem extends Node, TParent extends Node> =
  TItem extends Field<infer TValue, Node> ? Field<TValue, TParent>
    : TItem extends Form<infer TNodes, Node> ? Form<TNodes, TParent>
      : TItem extends Group<infer TNodes, Node> ? Group<TNodes, TParent>
        : TItem extends ArrayNode<infer TNestedItem, Node> ? ArrayNode<TNestedItem, TParent> : TItem;

export type ArrayValue<TItem extends Node> =
  TItem extends Form<infer TNodes, Node>
    ? { [K in keyof TNodes]: NodeValue<TNodes[K]> }[]
    : TItem extends Group<infer TNodes, Node>
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
  value: Signal<ArrayValue<TItem>>;
  /** Complete value represented by a control bound directly to this array. Pending descendant control values are not aggregated. */
  controlValue: Signal<ArrayValue<TItem>>;
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
  /** Moves the item one position toward the start. The first item remains in place. */
  moveUp(index: number): void;
  /** Moves the item one position toward the end. The last item remains in place. */
  moveDown(index: number): void;
  /**
   * Moves an item from `fromIndex` to `toIndex`, shifting the intervening items by one position.
   *
   * The moved node retains its identity, interaction state, validation state, and pending work.
   * Its path and the paths of affected siblings update to reflect their new indexes. Moving an
   * item to its current index is a no-op. Both indexes must identify existing items.
   *
   * @example
   * `items.move(3, 1)` moves the fourth item into the second position.
   */
  move(fromIndex: number, toIndex: number): void;
  /**
   * Exchanges two item positions without recreating either node.
   *
   * Both nodes retain their identity and state, while their paths update to their new indexes.
   * Passing the same index twice is a no-op. Both indexes must identify existing items.
   *
   * @example
   * `items.swap(0, 2)` exchanges the first and third items.
   */
  swap(firstIndex: number, secondIndex: number): void;
  clear(): void;
  /**
   * Reconciles the complete array value while preserving matching item nodes.
   *
   * ℹ️ Passing `null` or `undefined` clears the array.
   */
  set(value: ArraySet<TItem> | null | undefined): void;
  /**
   * Computes the complete array value using the configured index or `trackBy` reconciliation.
   *
   * ℹ️ Returning `null` or `undefined` clears the array.
  */
  update(updater: (value: ArrayValue<TItem>) => ArraySet<TItem> | null | undefined): void;
  /**
   * Partially updates existing item nodes by array index without changing the array structure.
   *
   * Each supplied index delegates to that item's own `patch()` operation. This is most useful for
   * arrays of forms, where individual object properties can be updated without supplying complete
   * item values. A field item treats its patch as a normal value assignment.
   *
   * The patch array's length does not resize this array: missing trailing indexes and sparse holes
   * are skipped, while supplied indexes beyond the current structure are ignored with a console
   * warning. Existing node identity and interaction state are preserved.
   *
   * ℹ️ `patch()` is positional. Use `set()` or `update()` for complete value reconciliation, and
   * use `insert()`, `removeAt()`, `move()`, or `swap()` for explicit structural changes.
   *
   * @example Patch selected properties of the first item.
   * ```ts
   * const people = array(
   *   { name: field(''), age: field(0) },
   *   [{ name: 'Marco', age: 30 }],
   * );
   *
   * people.patch([{ age: 31 }]);
   * // people() === [{ name: 'Marco', age: 31 }]
   * ```
   *
   * @example Skip the first item and patch only the second.
   * ```ts
   * people.patch([, { name: 'Lia' }]);
   * ```
   */
  patch(value: ArrayPatch<TItem>): void;
  /**
   * Resets state, optionally reconciling a complete value first.
   *
   * ℹ️ Passing `null` or `undefined` clears the array before resetting its state.
   */
  reset(...args: [] | [value: ArraySet<TItem> | null | undefined]): void;
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
  getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationError.WithTargetNode<ArrayNode<TItem, TParent>> & ValidationErrorMap[TKind]) | undefined;
  getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<ArrayNode<TItem, TParent>> & CustomValidationError<TKind>) | undefined;
  required: Signal<boolean>;
  pending: Signal<boolean>;
  /** Whether this array or an ancestor form is currently running its submission action. */
  submitting: Signal<boolean>;
  /** Whether any current item descendant has a pending control-value debounce. */
  debouncing: Signal<boolean>;
  /** Immediately commits every pending control value in this array's current item subtrees. */
  flush(): void;
  /** Focuses the first bound UI control in this array's current item subtrees, in DOM order. */
  focus(options?: FocusOptions): void;
  validationStatus: Signal<ValidationStatus>;
  touched: Signal<boolean>;
  untouched: Signal<boolean>;
  markAsTouched(options?: {
    /** When true, marks only this array and leaves every current item subtree untouched. */
    skipDescendants?: boolean;
  }): void;
  markAsUntouched(): void;
  dirty: Signal<boolean>;
  pristine: Signal<boolean>;
  markAsDirty(): void;
  markAsPristine(): void;
  disabled: Signal<boolean>;
  /** Active inherited and local causes of this array's disabled state. */
  disabledReasons: Signal<readonly DisabledReason[]>;
  enabled: Signal<boolean>;
  /** Disables this array subtree, optionally recording a user-facing reason. */
  disable(message?: string): void;
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
  & {
    (): ArrayValue<TItem>;
    /**
     * Complete array API and the recommended access path for application code.
     *
     * `$api` exposes the same API through the collision-safe convention shared by every node.
     */
    api: ArrayApi<TItem, TParent>;
    /**
     * Collision-safe access to the array API.
     *
     * Prefer `api` for normal application code. `$api` exists as the stable access convention
     * shared by every node, including forms whose children may be named `api`.
     *
     * This property is not obsolete and is not planned for removal. It is marked as deprecated
     * only to reduce its prominence in autocomplete and keep the usual `api` access easier to find.
     *
     * @deprecated Not actually deprecated. Prefer `api` unless collision-safe access is required.
     */
    $api: ArrayApi<TItem, TParent>;
  }
  & ArrayIndexes<TItem, TParent>
  & ArrayApi<TItem, TParent>
  & HiddenFunctionMembers<keyof ArrayApi<TItem, TParent>>;
