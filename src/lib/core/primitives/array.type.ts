import type { Signal } from '@angular/core';

import type { Field } from './field.type';
import type { Group } from './group.type';
import type { Form, FormOptions } from './form.type';
import type { OpaqueAngularField } from '../interop/angular-field.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { DisabledReason, Node, NodeKeyInParent, NodePatch, NodeSet, NodeValue, RootNode } from '../types/node.type';
import type { CustomValidationError, ValidationError, ValidationErrorMap, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';

export type ArrayOptions<TValue = any> = Omit<FormOptions<TValue>, 'submission' | 'validators' | 'debounce' | 'hidden' | 'disabled' | 'readonly'> & {
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
   * Default control-value debounce inherited by every current and future item.
   *
   * @example Give item controls a 300-millisecond debounce by default.
   * ```ts
   * array(field(''), { debounce: 300 });
   * ```
   *
   * @example Commit item control values when their controls lose focus.
   * ```ts
   * array(field(''), { debounce: 'blur' });
   * ```
   */
  debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);
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

/** Mutable array value produced by an array node, with every item mapped to its readable value. */
export type ArrayValue<TItem extends Node> =
  TItem extends Form<infer TNodes, Node>
    ? { [K in keyof TNodes]: NodeValue<TNodes[K]> }[]
    : TItem extends Group<infer TNodes, Node>
      ? { [K in keyof TNodes]: NodeValue<TNodes[K]> }[]
      : NodeValue<TItem>[];
/** Complete readonly sequence accepted by an array node's `set()`. */
export type ArraySet<TItem extends Node> = readonly NodeSet<TItem>[];
/** Readonly sequence accepted by an array node's `patch()`, mapped through the item patch type. */
export type ArrayPatch<TItem extends Node> = readonly NodePatch<TItem>[];

export type ArrayRoot<TItem extends Node, TParent extends Node> = Node extends TParent
  ? ArrayNode<TItem, TParent>
  : RootNode<TParent>;

export type ArrayItems<TItem extends Node, TParent extends Node> =
  readonly ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>[];

export type ArrayIndexes<TItem extends Node, TParent extends Node> = {
  /** Live item at this index, or `undefined` when the index is outside the current structure. */
  readonly [index: number]: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
};

export type ArrayApi<TItem extends Node, TParent extends Node = Node> = {
  /** Returns the concrete primitive represented by this node. */
  nodeType(): 'array';
  /**
   * Readonly signal containing the array node's current item nodes.
   * Reading it participates in reactive tracking, and its array reference changes when the
   * structure changes. The contained nodes are the live nodes owned by this array, not clones.
   * Use spread syntax or Array.from() when a mutable copy of the node list is needed.
   */
  items: Signal<ArrayItems<TItem, TParent>>;
  /** Current number of live item nodes. Equivalent to `items().length`. */
  length: Signal<number>;
  /** Complete root node containing this array, or this array itself when it is the root node. */
  form: Signal<ArrayRoot<TItem, TParent>>;
  /** Immediate structural parent of this array, or `null` when it is a root or has been detached. */
  parent: Signal<TParent | null>;
  /**
   * Property and array-index segments from the complete root to this array. Root arrays use `[]`.
   *
   * @example
   * ```ts
   * myForm.contacts.path();
   * // ['contacts']
   * ```
   */
  path: Signal<readonly string[]>;
  /**
   * Property or array index under which this array is stored, or `null` when it is a root array.
   *
   * @example
   * ```ts
   * myForm.items.keyInParent(); // 'items'
   * ```
   *
   * @example
   * ```ts
   * myForm.items[0]?.keyInParent(); // 0
   * ```
   */
  keyInParent: Signal<NodeKeyInParent<TParent>>;
  /**
   * Aggregated committed values of the current items.
   *
   * Prefer calling the array directly instead of using `names.value()` for ordinary value reads:
   *
   * @example
   * ```ts
   * const names = array(field(''), {
   *   initialValue: ['Marco', 'Lia'],
   * });
   *
   * names(); // ['Marco', 'Lia']
   * ```
   */
  value: Signal<ArrayValue<TItem>>;
  /** Complete value represented by a control bound directly to this array. Pending descendant control values are not aggregated. */
  controlValue: Signal<ArrayValue<TItem>>;
  /** Returns the live item node at `index`, or `undefined` when no item exists there. */
  at(index: number): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
  /** Invokes `callback` once for each current item node, in index order. */
  forEach(callback: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => void): void;
  /** Transforms each current item node and returns the collected results without changing the array. */
  map<TResult>(callback: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => TResult): TResult[];
  /** Returns the current item nodes accepted by a type-guard predicate. */
  filter<TFiltered extends ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => item is TFiltered): TFiltered[];
  /** Returns the current item nodes for which `predicate` produces a truthy result. */
  filter(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>[];
  /** Returns the first current item node accepted by a type-guard predicate, or `undefined`. */
  find<TFound extends ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => item is TFound): TFound | undefined;
  /** Returns the first current item node for which `predicate` is truthy, or `undefined`. */
  find(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
  /** Returns the index of the first item node matching `predicate`, or `-1` when none matches. */
  findIndex(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): number;
  /** Whether at least one current item node matches `predicate`. */
  some(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): boolean;
  /** Whether every current item node matches `predicate`. Returns `true` for an empty array. */
  every(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): boolean;
  /** Whether the exact item-node instance occurs at or after `fromIndex`. */
  includes(item: Node, fromIndex?: number): boolean;
  /** Returns the index of the exact item-node instance, or `-1` when it is absent. */
  indexOf(item: Node, fromIndex?: number): number;
  /** Iterates over a stable snapshot of the current item nodes in index order. */
  [Symbol.iterator](): IterableIterator<ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>;
  /**
   * Creates and appends an item node, optionally initializing it with `value`, and returns the new
   * live node. The new item starts pristine and untouched.
   */
  push(...args: [] | [value: NodeSet<TItem>]): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>;
  /**
   * Creates an item node at `index`, optionally initializes it with `value`, shifts later items,
   * and returns the new live node. Throws `RangeError` when `index` is outside `0..length`.
   */
  insert(index: number, ...args: [] | [value: NodeSet<TItem>]): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>;
  /**
   * Removes, detaches, and returns the item at `index`, or returns `undefined` for an invalid index.
   * A retained removed node remains independently usable.
   */
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
  /** Removes and detaches every current item node without marking the array dirty. */
  clear(): void;
  /**
   * Reconciles the complete array value while preserving matching item nodes.
   *
   * **Field items**
   *
   * ```ts
   * const names = array(field(''));
   *
   * names.set(['Marco', 'Lia']);
   * ```
   *
   * **Group items**
   *
   * ```ts
   * const people = array({ name: field('') });
   *
   * people.set([
   *   { name: 'Marco' },
   *   { name: 'Lia' },
   * ]);
   * ```
   *
   * ℹ️ Passing `null` or `undefined` clears the array.
   */
  set(value: ArraySet<TItem> | null | undefined): void;
  /**
   * Computes the complete array value using the configured index or `trackBy` reconciliation.
   *
   * **Field items**
   *
   * ```ts
   * const names = array(field(''));
   *
   * names.update(value => [...value, 'Lia']);
   * ```
   *
   * **Group items**
   *
   * ```ts
   * const people = array({ name: field('') });
   *
   * people.update(value => [
   *   ...value,
   *   { name: 'Lia' },
   * ]);
   * ```
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
  /** Current normalized validators assigned directly to this array, in declaration order. */
  validators: Signal<Validators<ArrayValue<TItem>>>;
  /** Replaces validators owned by this array and immediately validates its current aggregate value. */
  setValidators(validators: ValidatorSource<ArrayValue<TItem>>): void;
  /**
  * A signal containing the validation errors of **this array node itself, excluding its descendants**.
  *
  * ℹ️ To collect errors from the complete subtree, use `allErrors()` instead.
   *
   * @example
   * ```ts
   * names.errors();
   * // [{ kind: 'uniqueItems', duplicateIndexes: [0, 2], targetNode: names }]
   * ```
  */
  errors: Signal<readonly ValidationError.WithTargetNode<ArrayNode<TItem, TParent>>[]>;
  /**
  * A signal containing the validation errors of **this array node and its descendants**.
  *
  * ℹ️ To read only errors belonging directly to this array node, use `errors()` instead.
   *
   * @example
   * ```ts
   * names.allErrors();
   * // [{ kind: 'required', message: 'Name is required.', targetNode: names[0] }]
   * ```
  */
  allErrors: Signal<readonly ValidationError.WithTargetNode<Node>[]>;
  /** Whether this array and every current item subtree have completed validation without errors. */
  valid: Signal<boolean>;
  /** Whether this array or any current item subtree contributes a validation error. */
  invalid: Signal<boolean>;
  /**
   * Returns the first validation error belonging directly to this array and matching `kind`.
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationError.WithTargetNode<ArrayNode<TItem, TParent>> & ValidationErrorMap[TKind]) | undefined;
  /**
   * Returns the first custom error belonging directly to this array and matching `kind`.
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<ArrayNode<TItem, TParent>> & CustomValidationError<TKind>) | undefined;
  /** Whether active validation metadata marks this array itself as required. */
  required: Signal<boolean>;
  /** Whether asynchronous validation is active on this array or any current item subtree. */
  pending: Signal<boolean>;
  /** Whether an ancestor form is currently running its submission action. Arrays cannot initiate submission. */
  submitting: Signal<boolean>;
  /** Whether this array or any current item subtree has a control-originated value awaiting commit. */
  debouncing: Signal<boolean>;
  /** Immediately commits every pending control value in this array's current item subtrees. */
  flush(): void;
  /** Focuses the first bound UI control in this array's current item subtrees, in DOM order. */
  focus(options?: FocusOptions): void;
  /**
   * Aggregated validation phase for this array and its item subtrees: `'valid'`, `'invalid'`, or
   * `'unknown'`.
   *
   * `'unknown'` means asynchronous validation is pending on this array or an item and no error is
   * currently available anywhere in the subtree. While unknown, `pending()` is true and both
   * `valid()` and `invalid()` are false. Any available error makes the status `'invalid'`, even if
   * other validation remains pending.
   */
  validationStatus: Signal<ValidationStatus>;
  /**
   * Whether this array or any current item subtree has been marked touched.
   *
   * ℹ️ Disabled, readonly, or hidden nodes report `false` and do not contribute touched state to ancestors.
   */
  touched: Signal<boolean>;
  /**
   * Logical inverse of `touched()`.
   *
   * Whether neither this array nor any contributing item subtree currently reports touched state.
   */
  untouched: Signal<boolean>;
  /**
   * Marks this array and, by default, every item subtree as touched, making their effective
   * `touched()` true and `untouched()` false while they are interactive.
   */
  markAsTouched(options?: {
    /** When true, marks only this array and leaves every current item subtree untouched. */
    skipDescendants?: boolean;
  }): void;
  /** Recursively clears touched state, making `touched()` false and `untouched()` true throughout the subtree. */
  markAsUntouched(): void;
  /**
   * Whether this array currently reports user-modified state.
   *
   * This becomes `true` when the array's own state is marked dirty or an interactive item subtree
   * is dirty. Programmatic value and structural operations do not mark nodes dirty.
   * `markAsPristine()` clears only this array's own state, so a dirty item can keep the result true.
   */
  dirty: Signal<boolean>;
  /**
   * Logical inverse of `dirty()`.
   *
   * Whether neither this array nor any contributing item subtree currently reports user-modified state.
   */
  pristine: Signal<boolean>;
  /** Marks this array's own state dirty, making `dirty()` true and `pristine()` false while it is interactive. */
  markAsDirty(): void;
  /**
   * Clears this array's own dirty state. `pristine()` becomes true and `dirty()` false only when no
   * contributing item remains dirty.
   */
  markAsPristine(): void;
  /** Whether this array is effectively disabled by its own state or an ancestor reason. */
  disabled: Signal<boolean>;
  /**
   * Active inherited and local causes of this array's disabled state.
   *
   * @example
   * ```ts
   * names.disabledReasons();
   * // [
   * //   {
   * //     sourceNode: profile,
   * //     message: 'Profile is locked',
   * //   },
   * // ]
   * ```
   */
  disabledReasons: Signal<readonly DisabledReason[]>;
  /**
   * Logical inverse of `disabled()`.
   *
   * Whether this array has no active local or inherited disabled reason and can participate normally.
   */
  enabled: Signal<boolean>;
  /**
   * Disables this array subtree, optionally recording a user-facing reason.
   * Sets `disabled()` to true and `enabled()` to false on this array and its item subtrees.
   *
   * @example Disable without a reason
   * ```ts
   * names.disable();
   * ```
   *
   * @example Disable with a reason
   * ```ts
   * names.disable('Locked');
   * ```
   */
  disable(message?: string): void;
  /**
   * Clears the imperative disabled state created by `disable()`. `enabled()` becomes true only on
   * nodes without another configured or inherited disabled reason.
   */
  enable(): void;
  /** Whether this array is effectively readonly through its own state or an ancestor. */
  readonly: Signal<boolean>;
  /**
   * Logical inverse of `readonly()`.
   *
   * Whether this array accepts value changes from a control bound directly to it.
   */
  writable: Signal<boolean>;
  /** Marks this array subtree readonly, making `readonly()` true and `writable()` false throughout it. */
  markAsReadonly(): void;
  /**
   * Clears this array's imperative readonly state. `writable()` becomes true only on nodes without
   * another configured or inherited readonly state.
   */
  markAsWritable(): void;
  /** Whether this array is effectively hidden through its own state or an ancestor. */
  hidden: Signal<boolean>;
  /**
   * Logical inverse of `hidden()`.
   *
   * Whether this array is currently intended to be shown to the user.
   */
  visible: Signal<boolean>;
  /** Hides this array subtree, making `hidden()` true and `visible()` false throughout it. */
  hide(): void;
  /**
   * Clears this array's imperative hidden state. `visible()` becomes true only on nodes without
   * another configured or inherited hidden state.
   */
  show(): void;
};

export type ArrayNode<TItem extends Node, TParent extends Node = Node> =
  & {
    /** Returns the array's current aggregate committed value and participates in signal dependency tracking. */
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
     * Prefer `api` for ordinary application code; `$api` remains a supported, stable escape hatch.
     */
    $api: ArrayApi<TItem, TParent>;
    /**
     * Opaque Angular Signal Forms adapter for binding with `[formField]`.
     *
     * This property is supported and is not planned for removal. Use it only as the terminal value
     * passed to Angular's `[formField]` binding.
     *
     * @example
     * ```html
     * <input [formField]="form.user.$field" />
     * ```
     *
     */
    readonly $field: OpaqueAngularField;
  }
  & ArrayIndexes<TItem, TParent>
  & ArrayApi<TItem, TParent>
  & HiddenFunctionMembers<keyof ArrayApi<TItem, TParent>>;
