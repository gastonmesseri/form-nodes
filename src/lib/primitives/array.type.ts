import type { Injector, Signal } from '@angular/core';

import type { FieldNode } from './field.type';
import type { GroupNode } from './group.type';
import type { FormNode, FormOptions } from './form.type';
import type { NodeSignal } from '../types/node-signal.type';
import type { CallableNodeApi } from '../types/callable-node-api.type';
import type { NodeValueSignal } from '../types/node-value-signal.type';
import type { NodeErrorsSignal } from '../types/node-errors-signal.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { DisabledReason, NearestForm, AnyNode, IsUnknownNode, NodeKeyInParent, NodeSet, NodeValue, RootNode } from '../types/node.type';
import type { CustomValidationError, ValidationErrorMap, ValidationStatus, ValidatorSource, Validators, ValidationErrorWithTargetNode } from '../validation/validation.type';

export type ArrayOptions<TValue = any, TArray extends AnyNode = ArrayNode<AnyNode>> = Omit<FormOptions<TValue>, 'configure' | 'onValueChange' | 'onSubmit' | 'onSubmitBlocked' | 'submitWhen' | 'validators' | 'debounce' | 'hidden' | 'disabled' | 'readonly'> & {
  /**
   * Runs synchronously after the exposed value changes, including programmatic writes.
   * Initialization and writes retained by `equal` do not notify. Control writes wait for debounce.
   * Callbacks run untracked, without requiring an injector or waiting for async validation.
   * Aggregate writes notify descendants before their parent, once after child updates.
   * Reentrant writes are delivered after the current callback; returned values are ignored.
   *
   * **Default:** `undefined`; no callback.
   *
   * ```ts
   * const values: unknown[] = [];
   * const node = array({ name: field('Ada') }, {
   *   onValueChange(value) {
   *     values.push(value);
   *   },
   * });
   * node.set([
   *   { name: 'Lia' },
   * ]);
   * values.length; // 1
   * ```
   */
  onValueChange?(value: TValue, node: TArray): void;

  /**
   * Configures each new instance once, synchronously after its API and children are ready.
   * Receives the collision-safe callable `$api`. Runs untracked; validators installed here
   * track dependencies when they execute. Ancestors may not be attached yet.
   * Use the callback argument rather than the variable being initialized. Fresh template
   * clones run their own callback; reset, reordering, and edits do not rerun it.
   * Returned values are ignored; this is neither an async hook nor a cleanup registration.
   *
   * **Default:** `undefined`; no initialization callback.
   *
   * ```ts
   * array({
   *   name: field(''),
   * }, {
   *   configure(api) {
   *     api.setValidators(() => null);
   *   },
   * });
   * ```
   */
  configure?: (api: TArray['$api']) => void;

  /**
   * Configures each newly created item once with its typed, collision-safe callable `$api`.
   * Runs after the item's own configure callback and supplied initial value, before attachment
   * to this array and capture of its reset-to-initial baseline. Children are ready; ancestors
   * may not be attached. Works with templates and factories, without requiring an injector.
   * Runs synchronously and untracked, with value-change notifications suppressed. Returned
   * values are ignored; promises are not awaited and returned functions are not cleanup hooks.
   * Edits, moves, and resets of reused items do not rerun it; newly created items do.
   * The original template and templateValue() drafts do not run this callback.
   *
   * **Default:** `undefined`; no per-item configuration.
   *
   * ```ts
   * const profile = form({
   *   rows: array({
   *     code: field(''),
   *     detail: field(''),
   *   }, {
   *     configureEach(api) {
   *       api.children.code.onValueChange(() => {
   *         api.patch({ detail: '' });
   *       });
   *     },
   *   }),
   * });
   * ```
   */
  configureEach?: (api: TArray extends { readonly [index: number]: AnyNode | undefined } ? NonNullable<TArray[number]>['$api'] : never) => void;

  /**
   * Registers rules on this node's exposed value. Aggregate rules receive the complete
   * object or array; put per-field rules on children. A synchronous composition may return
   * validators; asynchronous rules must be wrapped with `asyncValidator()`.
   * Null and undefined entries are ignored. Contexts are typed; inline returns intentionally
   * allow self-reference inference. Use `validator()` or an explicit result annotation
   * when returned errors also need strict checking.
   *
   * **Return Type:** `ComposableValidationResult<TValue>` for each synchronous callback.
   * Return `null`, `undefined`, or `void` for success; a message, error, or array of them for failure;
   * or validators for synchronous composition. See {@link ComposableValidationResult}.
   * Wrap asynchronous callbacks with `asyncValidator()`.
   *
   * **Default:** `[]`; no own validators.
   *
   * **Accepted values:**
   *
   * - **Functions**: One rule or synchronous composition.
   * - **Arrays**: Rules in declaration order; nullish entries are skipped.
   *
   * See {@link ValidatorSource}, {@link ValidationResult}, and {@link ComposableValidationResult}.
   *
   * ```ts
   * array({
   *   name: field(''),
   * }, {
   *   validators: () => null,
   * });
   * ```
   *
   * ```ts
   * array({
   *   name: field(''),
   * }, {
   *   validators: () => ({ kind: 'blocked' }),
   * });
   * ```
   *
   * ```ts
   * array({
   *   name: field(''),
   * }, {
   *   validators: asyncValidator(async () => {
   *     await Promise.resolve();
   *     return null;
   *   }),
   * });
   * ```
   */
  validators?: ValidatorSource<TValue, TArray>;
  /**
   * Delays control-originated value commits. Descendants inherit this strategy unless
   * they supply their own. Programmatic writes commit immediately. A later edit aborts
   * the previous delay; `flush()` or an interactive `markAsTouched()` commits pending input.
   *
   * **Default:** `undefined`; inherit the nearest configured strategy, otherwise commit immediately.
   *
   * **Accepted values:**
   *
   * - **Numbers**: Wait this many milliseconds after the latest control edit.
   * - `blur`: Commit on touch/focus loss.
   * - **Functions**: Commit after the returned promise settles successfully; receive the cancellation signal.
   *
   * ```ts
   * array({
   *   name: field(''),
   * }, {
   *   debounce: 300,
   * });
   *
   * array({
   *   name: field(''),
   * }, {
   *   debounce: 'blur',
   * });
   *
   * array({
   *   name: field(''),
   * }, {
   *   debounce: async abortSignal => {
   *     await Promise.resolve();
   *     if (abortSignal.aborted) return;
   *   },
   * });
   * ```
   */
  debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);
  /**
   * Controls this node's local hidden state. Descendants inherit active hidden state;
   * programmatic writes remain available. Hidden nodes suppress their own validation
   * and reported interaction state. Hiding does not delete values or stored dirty/touched state.
   *
   * The callback return type is intentionally unchecked
   * so it can reference its containing node without a circular inference error. Add an
   * explicit return annotation when authoring a strictly checked callback. Node values
   * and state signals retain their inferred types.
   *
   * **Return Type:** `boolean` for the callback.
   *
   * **Default:** `false` locally; active ancestor state still applies.
   *
   * **Accepted values:**
   *
   * - **Booleans**: Enable or clear the local configured state.
   * - **Functions**: Reevaluate tracked signal reads to derive the local state.
   *
   * ```ts
   * array({
   *   name: field(''),
   * }, {
   *   hidden: true,
   * });
   * ```
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const active = signal(false);
   * array({
   *   name: field(''),
   * }, {
   *   hidden: () => active(),
   * });
   * ```
   */
  hidden?: boolean | (() => any);
  /**
   * Controls this node's local disabled state, inherited by descendants. A string disables
   * the node and contributes a user-facing reason, including an empty string.
   * Disabled nodes retain their values and accept programmatic writes; their own validation
   * and reported interaction state are suppressed. Ancestor reasons cannot be cleared locally.
   *
   * The callback return type is intentionally unchecked
   * so it can reference its containing node without a circular inference error. Add an
   * explicit return annotation when authoring a strictly checked callback. Node values
   * and state signals retain their inferred types.
   *
   * **Return Type:** `boolean | string` for the callback.
   *
   * **Default:** `false` locally; active ancestor state still applies.
   *
   * **Accepted values:**
   *
   * - **Booleans**: Enable or clear the local configured state.
   * - **Functions**: Reevaluate tracked signal reads to derive the local state.
   * - **Strings**: Disable locally and record the text in `disabledReasons()`.
   *
   * ```ts
   * array({
   *   name: field(''),
   * }, {
   *   disabled: true,
   * });
   * ```
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const active = signal(false);
   * array({
   *   name: field(''),
   * }, {
   *   disabled: () => active(),
   * });
   * ```
   *
   * ```ts
   * array({
   *   name: field(''),
   * }, {
   *   disabled: 'Locked',
   * });
   * ```
   */
  disabled?: boolean | string | (() => any);
  /**
   * Controls this node's local readonly state. Descendants inherit active readonly state.
   * It prevents control-originated edits, not programmatic writes. Readonly nodes suppress
   * their own validation and reported dirty/touched state without discarding stored interaction.
   *
   * The callback return type is intentionally unchecked
   * so it can reference its containing node without a circular inference error. Add an
   * explicit return annotation when authoring a strictly checked callback. Node values
   * and state signals retain their inferred types.
   *
   * **Return Type:** `boolean` for the callback.
   *
   * **Default:** `false` locally; active ancestor state still applies.
   *
   * **Accepted values:**
   *
   * - **Booleans**: Enable or clear the local configured state.
   * - **Functions**: Reevaluate tracked signal reads to derive the local state.
   *
   * ```ts
   * array({
   *   name: field(''),
   * }, {
   *   readonly: true,
   * });
   * ```
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const active = signal(false);
   * array({
   *   name: field(''),
   * }, {
   *   readonly: () => active(),
   * });
   * ```
   */
  readonly?: boolean | (() => any);
  /**
   * Initializes collection items from complete values or the template defaults.
   * Null and undefined normalize to an empty array; the collection value is never nullable.
   * Cannot be combined with initialLength or a positional initial value.
   * Numeric values remain supported for compatibility; prefer initialLength for a count.
   *
   * **Default:** `[]`; no items.
   *
   * **Accepted values:**
   *
   * - **Arrays**: Create one item for each supplied value.
   * - **Non-negative integers**: Create this many items from the template.
   * - **Nullish values**: Create no items.
   *
   * ```ts
   * array({
   *   name: field(''),
   * }, {
   *   initialValue: [
   *     { name: 'Ada' },
   *   ],
   * });
   * ```
   *
   * ```ts
   * array({
   *   name: field(''),
   * }, {
   *   initialValue: 3,
   * });
   * ```
   */
  initialValue?: TValue | number | null;

  /**
   * Creates this many independent items from the template or factory defaults.
   * Runs configureEach for every new item. Only controls initialization, not a minimum or
   * fixed length; structural edits remain available and resetToInitial restores the baseline.
   * Cannot be combined with initialValue or a positional initial value/count.
   *
   * **Default:** `undefined`; use the other initial source, or create an empty array.
   *
   * **Accepted values:** Non-negative safe integers, including zero. Invalid counts throw RangeError.
   *
   * ```ts
   * const profile = form({
   *   people: array({
   *     name: field(''),
   *   }, {
   *     initialLength: 3,
   *   }),
   * });
   * profile.people.length(); // 3
   * ```
   */
  initialLength?: number;
  /**
   * Selects stable item identity during `set()`, `patch()`, `update()`, and value-reset reconciliation.
   * Matching keys retain and move existing nodes; new keys create nodes and removed keys detach them.
   * Retained nodes keep their identity and interaction state while their values and paths update.
   * Every current and incoming key must be unique; duplicate keys throw before mutation.
   *
   * **Default:** `undefined`; reuse existing nodes by array index.
   *
   * **Accepted values:**
   *
   * - **Property names**: Read a typed key from each object item.
   * - **Functions**: Derive a key from the complete item value and index.
   *
   * ```ts
   * array({
   *   id: field(0),
   *   name: field(''),
   * }, {
   *   initialValue: [
   *     { id: 1, name: 'Ada' },
   *   ],
   *   trackBy: 'id',
   * });
   * ```
   *
   * ```ts
   * array({
   *   id: field(0),
   * }, {
   *   trackBy: value => value.id,
   * });
   * ```
   */
  trackBy?: TValue extends readonly (infer TItemValue)[]
    ? ((value: TItemValue, index: number) => unknown)
      | (TItemValue extends object ? Extract<keyof TItemValue, string> : never)
    : never;
} & ({ initialValue?: never } | { initialLength?: never });

export type ArrayItemWithParent<TItem extends AnyNode, TParent extends AnyNode> =
  TItem extends FieldNode<infer TValue, AnyNode> ? FieldNode<TValue, TParent>
    : TItem extends FormNode<infer TNodes, AnyNode> ? FormNode<TNodes, TParent>
      : TItem extends GroupNode<infer TNodes, AnyNode> ? GroupNode<TNodes, TParent>
        : TItem extends ArrayNode<infer TNestedItem, AnyNode> ? ArrayNode<TNestedItem, TParent> : TItem;

/**
 * Mutable array value produced by an array node, with every item mapped to its readable value.
 *
 * ```ts
 * const name = field('Ada');
 * const names = array(name);
 * const values: ArrayValue<typeof name> = [
 *   'Lia',
 * ];
 * names.set(values);
 * names(); // ['Lia']
 * ```
 */
export type ArrayValue<TItem extends AnyNode> =
  TItem extends FormNode<infer TNodes, AnyNode>
    ? { [K in keyof TNodes]: NodeValue<TNodes[K]> }[]
    : TItem extends GroupNode<infer TNodes, AnyNode>
      ? { [K in keyof TNodes]: NodeValue<TNodes[K]> }[]
      : NodeValue<TItem>[];
/**
 * Complete readonly sequence accepted by an array node's `set()`.
 *
 * ```ts
 * const name = field('Ada');
 * const names = array(name);
 * const values: ArraySet<typeof name> = [
 *   'Lia',
 * ];
 * names.set(values);
 * names(); // ['Lia']
 * ```
 */
export type ArraySet<TItem extends AnyNode> = readonly NodeSet<TItem>[];
/**
 * Complete readonly sequence accepted by an array node's `patch()`, identical to its set value.
 *
 * ```ts
 * const name = field('Ada');
 * const names = array(name);
 * const values: ArrayPatch<typeof name> = [
 *   'Lia',
 * ];
 * names.patch(values);
 * names(); // ['Lia']
 * ```
 */
export type ArrayPatch<TItem extends AnyNode> = ArraySet<TItem>;

export type ArrayRoot<TItem extends AnyNode, TParent extends AnyNode> = AnyNode extends TParent
  ? IsUnknownNode<TItem> extends true ? AnyNode : ArrayNode<TItem, TParent>
  : RootNode<TParent>;

export type ArrayItems<TItem extends AnyNode, TParent extends AnyNode> =
  readonly ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>[];

export type ArrayIndexes<TItem extends AnyNode, TParent extends AnyNode> = {
  /** Live item at this index, or `undefined` when the index is outside the current structure. */
  readonly [index: number]: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
};

export type ArrayApi<TItem extends AnyNode, TParent extends AnyNode = AnyNode> = {
  /**
   * Returns the concrete primitive represented by this node.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.nodeType(); // 'array'
   * ```
   */
  nodeType(): 'array';
  /**
   * Subscribes to future exposed value changes and returns an idempotent cancellation function.
   * Runs untracked, respects equality and control debounce, and skips initial
   * values. Multiple listeners coexist with the construction callback; subscriptions are not cloned.
   * The explicit injector, otherwise the registration context, owns the listener. The node's
   * current injector also ends the subscription on destruction and acts as the fallback owner.
   * Binding and ancestor ownership follow the node when it is rebound or detached.
   * Without an injector, observation still works and can be canceled manually.
   * A positive `debounce` delays only this callback until that many milliseconds without another
   * change. Omitted or zero stays synchronous. Cancellation drops pending delivery.
   * Node values, validation, and interaction state are unaffected by the subscription delay.
   *
   * ```ts
   * const node = array({ name: field('Ada') });
   * const values: unknown[] = [];
   * const stop = node.onValueChange(value => {
   *   values.push(value);
   * });
   * node.push({ name: 'Grace' });
   * values.length; // 1
   * stop();
   * ```
   *
   * ```ts
   * const node = array({ name: field('Ada') });
   * const stop = node.onValueChange(value => {
   *   console.log(value);
   * }, { debounce: 300 });
   * // Cancel pending and future delivery.
   * stop();
   * ```
   *
   * @param callback Receives the exposed value and original node after a committed change. Return values are ignored. Synchronous errors propagate after other listeners are notified; debounced errors are thrown from the timer callback.
   * @param options Optional debounce in finite, non-negative milliseconds (default zero); invalid delays throw RangeError. Optional subscription owner. Omission uses the registration context, falling back to the node's injector; an explicit injector does not change node ownership.
   */
  onValueChange(callback: (value: ArrayValue<TItem>, node: ArrayNode<TItem, TParent>) => void, options?: { injector?: Injector; debounce?: number }): () => void;
  /**
   * Returns an independent value for one new item without adding it to this array.
   * Template declarations use their captured defaults, independently of current rows and this
   * array's `initialValue`. Reading a template does not construct nodes or run their validators
   * or `configure()` callbacks. The call does not track signal dependencies.
   *
   * For a factory declaration, each call executes the factory and initializes a detached item;
   * its normal configuration and validation effects can run, and errors propagate.
   * Reused definitions and nodes already attached to a parent are rejected.
   * The returned value reflects that item's committed data. No item is attached to this array.
   *
   * Plain objects, arrays, Date, Map, and Set are copied, including cycles. Opaque objects such
   * as class instances and files retain their references; accessor state is not snapshotted.
   *
   * ```ts
   * const users = array({
   *   username: field(''),
   *   role: field('reader'),
   * });
   * const draft = users.templateValue();
   * draft.username = 'Ada';
   * users.length(); // 0
   * users.push(draft);
   * users.at(0)?.username(); // 'Ada'
   * ```
   */
  templateValue(): NodeValue<TItem>;

  /**
   * Readonly signal containing the array node's current item nodes.
   * Reading it participates in reactive tracking, and its array reference changes when the
   * structure changes. The contained nodes are the live nodes owned by this array, not clones.
   * Use spread syntax or Array.from() when a mutable copy of the node list is needed.
   *
   * ```ts
   * const profile = form({
   *   people: array({ name: field('Ada') }, {
   *     initialValue: 1,
   *   }),
   * });
   * profile.people.items()[0]?.name();
   * // 'Ada'
   * ```
   */
  items: Signal<ArrayItems<TItem, TParent>>;
  /**
   * Current number of live item nodes. Equivalent to `items().length`.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.length(); // 1
   * ```
   */
  length: Signal<number>;
  /**
   * Nearest explicit `form()` containing this array, or `null` when no form workflow owns it.
   * A nested explicit form is the workflow owner instead of the complete structural root.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.form(); // null
   * ```
   */
  form: Signal<NearestForm<TParent> | null>;
  /**
   * Complete structural root containing this array. A root or detached array returns itself.
   * Use this signal when traversal must cross nested form workflow boundaries.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.root() === node; // true
   * ```
   */
  root: Signal<ArrayRoot<TItem, TParent>>;
  /**
   * Immediate structural parent of this array, or `null` when it is a root or has been detached.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.parent(); // null
   * ```
   */
  parent: Signal<TParent | null>;
  /**
   * Property and array-index segments from the complete root to this array. Root arrays use `[]`.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.path(); // []
   * ```
   */
  path: Signal<readonly string[]>;
  /**
   * Property or array index under which this array is stored, or `null` when it is a root array.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.keyInParent(); // null
   * ```
   */
  keyInParent: Signal<NodeKeyInParent<TParent>>;
  /**
   * Exposed aggregate of item values. The `equal` option can retain an earlier equivalent array
   * independently of current item values and structure.
   *
   * `value.committed()` reads committed data before configured equality; `value.control()` also
   * includes this node's pending input. Their `set()` methods perform committed/control writes.
   * See {@link NodeValueSignal} for debounce, aggregate, validation, and interaction semantics.
   *
   * Prefer calling the array directly instead of using `names.value()` for ordinary value reads:
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node(); // [{ name: 'Ada' }]
   * ```
   */
  value: NodeValueSignal<ArrayValue<TItem>, ArraySet<TItem> | null | undefined>;
  /**
   * Returns a stable, live readonly signal of the exposed value, with no node operations.
   * Preserves configured equality and committed-value reads; pending control input remains pending.
   * This does not mark the node readonly or prevent deep mutation of object values.
   * The node and its `$api` return the same signal, and the method is safe to extract.
   *
   * ```ts
   * const profile = form({
   *   users: array({ name: field('Ada') }),
   * });
   * const users = profile.users.asReadonly();
   * profile.users.push();
   * users(); // [{ name: 'Ada' }]
   * ```
   */
  asReadonly(): Signal<ArrayValue<TItem>>;
  /**
   * Returns the live item node at `index`, or `undefined` when no item exists there.
   * Negative indexes count from the end: `-1` selects the last item.
   * Like `Array.prototype.at()`, fractional indexes truncate toward zero,
   * `NaN` selects index zero, and infinite or out-of-range indexes return `undefined`.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * items.at(0)?.(); // 'Ada'
   * items.at(-1)?.(); // 'Max'
   * items.at(-2)?.(); // 'Lia'
   * items.at(-4); // undefined
   * ```
   *
   * @reactive Tracks the current item collection.
   */
  at(index: number): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
  /**
   * Invokes `callback` once for each current item node, in index order.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * const names: (string | null)[] = [];
   * items.forEach(item => {
   *   names.push(item());
   * });
   * names; // ['Ada', 'Lia', 'Max']
   * ```
   */
  forEach(callback: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => void): void;
  /**
   * Transforms each current item node and returns the collected results without changing the array.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * items.map(item => item());
   * // ['Ada', 'Lia', 'Max']
   * ```
   */
  map<TResult>(callback: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => TResult): TResult[];
  /**
   * Returns the current item nodes accepted by a type-guard predicate.
   *
   * ```ts
   * const users = array({
   *   username: field(''),
   * }, {
   *   initialValue: [
   *     { username: 'Ada' },
   *     { username: 'Lia' },
   *   ],
   * });
   * const matches = users.filter(user => {
   *   return user.username() === 'Ada';
   * });
   * matches[0]?.username(); // 'Ada'
   * ```
   */
  filter<TFiltered extends ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => item is TFiltered): TFiltered[];
  /**
   * Returns the current item nodes for which `predicate` produces a truthy result.
   *
   * ```ts
   * const users = array({
   *   username: field(''),
   * }, {
   *   initialValue: [
   *     { username: 'Ada' },
   *     { username: 'Lia' },
   *   ],
   * });
   * const matches = users.filter(user => {
   *   return user.username() === 'Ada';
   * });
   * matches[0]?.username(); // 'Ada'
   * ```
   */
  filter(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>[];
  /**
   * Returns the first current item node accepted by a type-guard predicate, or `undefined`.
   *
   * ```ts
   * const users = array({
   *   username: field(''),
   * }, {
   *   initialValue: [
   *     { username: 'Ada' },
   *     { username: 'Lia' },
   *   ],
   * });
   * const match = users.find(user => {
   *   return user.username() === 'Ada';
   * });
   * match?.username(); // 'Ada'
   * ```
   */
  find<TFound extends ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => item is TFound): TFound | undefined;
  /**
   * Returns the first current item node for which `predicate` is truthy, or `undefined`.
   *
   * ```ts
   * const users = array({
   *   username: field(''),
   * }, {
   *   initialValue: [
   *     { username: 'Ada' },
   *     { username: 'Lia' },
   *   ],
   * });
   * const match = users.find(user => {
   *   return user.username() === 'Ada';
   * });
   * match?.username(); // 'Ada'
   * ```
   */
  find(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
  /**
   * Returns the index of the first item node matching `predicate`, or `-1` when none matches.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * items.findIndex(item => item() === 'Lia');
   * // 1
   * ```
   */
  findIndex(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): number;
  /**
   * Whether at least one current item node matches `predicate`.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * items.some(item => item() === 'Ada');
   * // true
   * ```
   */
  some(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): boolean;
  /**
   * Whether every current item node matches `predicate`. Returns `true` for an empty array.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * items.every(item => item() !== null);
   * // true
   * ```
   */
  every(predicate: (item: ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>, index: number, array: ArrayNode<TItem, TParent>) => unknown): boolean;
  /**
   * Whether the exact item-node instance occurs at or after `fromIndex`.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * const first = items.at(0)!;
   * items.includes(first); // true
   * ```
   */
  includes(item: AnyNode, fromIndex?: number): boolean;
  /**
   * Returns the index of the exact item-node instance, or `-1` when it is absent.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * const first = items.at(0)!;
   * items.indexOf(first); // 0
   * ```
   */
  indexOf(item: AnyNode, fromIndex?: number): number;
  /**
   * Iterates over a stable snapshot of the current item nodes in index order.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * [...items].map(item => item());
   * // ['Ada', 'Lia', 'Max']
   * ```
   */
  [Symbol.iterator](): IterableIterator<ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>>;
  /**
   * Creates and appends an item node, optionally initializing it with `value`, and returns the new
   * live node. The new item starts pristine and untouched.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * const added = items.push('Sam');
   * added(); // 'Sam'
   * items.length(); // 4
   * ```
   */
  push(...args: [] | [value: NodeSet<TItem>]): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>;
  /**
   * Creates an item node at `index`, optionally initializes it with `value`, shifts later items,
   * and returns the new live node. Throws `RangeError` when `index` is outside `0..length`.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * items.insert(1, 'Sam');
   * items.at(1)?.(); // 'Sam'
   * ```
   */
  insert(index: number, ...args: [] | [value: NodeSet<TItem>]): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>>;
  /**
   * Removes, detaches, and returns the item at `index`, or returns `undefined` for an invalid index.
   * A retained removed node remains independently usable.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * const removed = items.removeAt(0);
   * removed?.(); // 'Ada'
   * removed?.parent(); // null
   * ```
   */
  removeAt(index: number): ArrayItemWithParent<TItem, ArrayNode<TItem, TParent>> | undefined;
  /**
   * Moves the item one position toward the start. The first item remains in place.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * items.moveUp(1);
   * items(); // ['Lia', 'Ada', 'Max']
   * ```
   */
  moveUp(index: number): void;
  /**
   * Moves the item one position toward the end. The last item remains in place.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * items.moveDown(1);
   * items(); // ['Ada', 'Max', 'Lia']
   * ```
   */
  moveDown(index: number): void;
  /**
   * Moves an item from `fromIndex` to `toIndex`, shifting the intervening items by one position.
   *
   * The moved node retains its identity, interaction state, validation state, and pending work.
   * Its path and the paths of affected siblings update to reflect their new indexes. Moving an
   * item to its current index is a no-op. Both indexes must identify existing items.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * items.move(2, 0);
   * items(); // ['Max', 'Ada', 'Lia']
   * ```
   */
  move(fromIndex: number, toIndex: number): void;
  /**
   * Exchanges two item positions without recreating either node.
   *
   * Both nodes retain their identity and state, while their paths update to their new indexes.
   * Passing the same index twice is a no-op. Both indexes must identify existing items.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * items.swap(0, 2);
   * items(); // ['Max', 'Lia', 'Ada']
   * ```
   */
  swap(firstIndex: number, secondIndex: number): void;
  /**
   * Removes and detaches every current item node without marking the array dirty.
   *
   * ```ts
   * const items = array(field(''), {
   *   initialValue: ['Ada', 'Lia', 'Max'],
   * });
   * items.clear();
   * items(); // []
   * ```
   */
  clear(): void;
  /**
   * Reconciles the complete array value while preserving matching item nodes.
   *
   * Untyped item properties omitted at runtime use construction defaults; explicit `undefined` is preserved.
   * ℹ️ Passing `null` or `undefined` clears the array.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.set([
   *   { name: 'Lia' },
   * ]);
   * node(); // [{ name: 'Lia' }]
   * ```
   */
  set(value: ArraySet<TItem> | null | undefined): void;
  /**
   * Computes the complete array value using the configured index or `trackBy` reconciliation.
   *
   * ℹ️ Returning `null` or `undefined` clears the array.
   *
   * ```ts
   * const people = array({
   *   name: field('Ada'),
   * }, { initialValue: 1 });
   * people.update(rows => [
   *   ...rows,
   *   { name: 'Lia' },
   * ]);
   * people.length(); // 2
   * ```
   */
  update(updater: (value: ArrayValue<TItem>) => ArraySet<TItem> | null | undefined): void;
  /**
   * Reconciles the complete array value, exactly like `set()`.
   * Untyped omitted item properties use template/factory defaults, including on reused rows.
   * Explicit `undefined` remains explicit; TypeScript still requires complete items.
   *
   * The incoming collection determines the length and order. Every item must supply its complete
   * set value, including nested arrays. Matching nodes are reused by index or `trackBy`, new nodes
   * are created, and missing nodes are detached. Reused nodes retain interaction state.
   * `null` and `undefined` clear the array. This also applies to arrays passed to `form.patch()`.
   *
   * To partially edit one existing object row, call that row's `patch()` instead.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.patch([
   *   { name: 'Lia' },
   * ]);
   * node(); // [{ name: 'Lia' }]
   * ```
   */
  patch(value: ArrayPatch<TItem> | null | undefined): void;
  /**
   * Resets state, optionally reconciling a complete value first.
   *
   * ℹ️ Passing `null` or `undefined` clears the array before resetting its state.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.set([
   *   { name: 'Lia' },
   * ]);
   * node.markAsDirty();
   * node.reset();
   * node(); // [{ name: 'Lia' }]
   * node.dirty(); // false
   * ```
   */
  reset(...args: [] | [value: ArraySet<TItem> | null | undefined]): void;
  /**
   * Restores captured initial item values, count and order, and resets subtree interaction state.
   *
   * Captures effective values after initialValue has been applied. Numeric initialValue captures
   * the values actually generated for those items. Later insertions, removals, set(), and resets
   * do not redefine this array baseline; an initially empty array becomes empty again.
   * Reuses nodes by index or trackBy, removes excess nodes, and creates missing nodes. A factory
   * may run to reconstruct missing nodes, but captured values replace freshly generated defaults.
   * Removed node instances are not resurrected. Matching retained rows preserve their current
   * object schema; dynamically added fields restore their own initial values.
   *
   * Cancels pending control input, clears dirty/touched state, resets control parsing state, and
   * synchronizes bound controls. Current validators and availability configuration remain in place;
   * the restored value can be invalid and asynchronous validation can still be pending.
   * This programmatic operation does not emit formNodeValueChange or formNodeControlValueChange.
   * Neither set(), patch(), update(), nor reset(value) replaces the stored initial values.
   *
   * Ordinary arrays, plain objects (including null-prototype objects), Date, Map, and Set are copied
   * at capture and on restoration, including cycles and shared references within a captured value.
   * Custom classes/subclasses, functions, files, typed arrays, and other opaque objects retain their
   * references: in-place mutations of those values cannot be undone. Accessor descriptors are
   * preserved without invoking getters; their external state is not captured. Prefer immutable
   * values or reset(applicationOwnedSnapshot) when a custom snapshot policy is needed.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.set([
   *   { name: 'Lia' },
   * ]);
   * node.resetToInitial();
   * node(); // [{ name: 'Ada' }]
   * ```
   */
  resetToInitial(): void;
  /**
   * Current normalized validators assigned directly to this array, in declaration order.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * const rule = validator(() => null);
   * node.setValidators(rule);
   * node.validators()[0] === rule; // true
   * ```
   */
  validators: Signal<Validators<ArrayValue<TItem>>> & {
    /**
     * Resolves returned synchronous compositions; async validators remain unexecuted references.
     *
     * ```ts
     * const node = array({
     *   name: field('Ada'),
     * }, {
     *   initialValue: 1,
     * });
     * const rule = validator(() => null);
     * node.setValidators(() => [rule]);
     * node.validators({ resolve: true })[0] ===
     *   rule; // true
     * ```
     *
     * @reactive Tracks composition dependencies and shares synchronous validation evaluation.
     */
    (options: { resolve?: boolean }): Validators<ArrayValue<TItem>>;
  };
  /**
   * Replaces validators owned by this array and immediately validates its current aggregate value.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * node.invalid(); // true
   * ```
   */
  setValidators(validators: ValidatorSource<ArrayValue<TItem>, ArrayNode<TItem, TParent>>): void;
  /**
   * A signal containing the validation errors of **this array node itself, excluding its descendants**.
   *
   * ℹ️ To collect errors from the complete subtree, use `allErrors()` instead.
   *
   * Pass `{ descendants: true }` to read the same subtree errors as `allErrors()`.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * node.errors().map(error => error.kind);
   * // ['blocked']
   * ```
   *
   * @reactive Tracks own errors by default, or subtree errors when descendants is true.
   */
  errors: NodeErrorsSignal<ArrayNode<TItem, TParent>>;
  /**
   * A signal containing the validation errors of **this array node and its descendants**.
   *
   * ℹ️ To read only errors belonging directly to this array node, use `errors()` instead.
   *
   * Shortcut for `errors({ descendants: true })`, returning the same cached array.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * node.allErrors().map(error => error.kind);
   * // ['blocked']
   * ```
   */
  allErrors: Signal<readonly ValidationErrorWithTargetNode<AnyNode>[]>;
  /**
   * Whether this array and every current item subtree have completed validation without errors.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.valid(); // true
   * ```
   */
  valid: Signal<boolean>;
  /**
   * Whether this array or any current item subtree contributes a validation error.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.invalid(); // false
   * ```
   */
  invalid: Signal<boolean>;
  /**
   * Returns the first validation error belonging directly to this array and matching `kind`.
   * Suggests registered error kinds while accepting any custom string.
   *
   * ```ts
   * const people = array({
   *   name: field(''),
   * }, {
   *   validators: minLength(1),
   * });
   * people.getError('minLength')?.minLength; // 1
   * ```
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationErrorWithTargetNode<ArrayNode<TItem, TParent>> & ValidationErrorMap[TKind]) | undefined;
  /**
   * Returns the first custom error belonging directly to this array and matching `kind`.
   * Suggests registered error kinds while accepting any custom string.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * node.getError('blocked')?.kind;
   * // 'blocked'
   * ```
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends keyof ValidationErrorMap | (string & {})>(kind: TKind): (ValidationErrorWithTargetNode<ArrayNode<TItem, TParent>> & CustomValidationError<TKind>) | undefined;
  /**
   * Whether this node's own errors contain the given kind. Does not search descendants.
   * Suggests registered error kinds while accepting any custom string.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * node.hasError('blocked'); // true
   * ```
   *
   * @reactive Memoizes by kind and tracks the node's current errors.
   */
  hasError(kind: keyof ValidationErrorMap | (string & {})): boolean;
  /**
   * Whether the same validator function is directly registered on this node, including async validators.
   * By default, does not run validators. Set resolve to true to inspect resolved leaf references.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * const rule = validator(() => null);
   * node.setValidators(rule);
   * node.hasValidator(rule); // true
   * ```
   *
   * @reactive Memoizes by function identity and resolution mode; resolved queries track composition dependencies.
   */
  hasValidator(validator: (context: any) => unknown, options?: { resolve?: boolean }): boolean;
  /**
   * Whether active validation metadata marks this array itself as required.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.required(); // false
   * ```
   */
  required: Signal<boolean>;
  /**
   * Whether asynchronous validation is active on this array or any current item subtree.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.pending(); // false
   * ```
   */
  pending: Signal<boolean>;
  /**
   * Whether an ancestor form is currently running its submission action. Arrays cannot initiate submission.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.submitting(); // false
   * ```
   */
  submitting: Signal<boolean>;
  /**
   * Whether this array or any current item subtree has a control-originated value awaiting commit.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.debouncing(); // false
   * ```
   */
  debouncing: Signal<boolean>;
  /**
   * Immediately commits every pending control value in this array's current item subtrees.
   *
   * ```ts
   * const people = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   *   debounce: 'blur',
   * });
   * people.at(0)!.name.value.control.set('Lia');
   * people.flush();
   * people.at(0)!.name(); // 'Lia'
   * ```
   */
  flush(): void;
  /**
   * Focuses the first bound UI control in this array's current item subtrees, in DOM order.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   imports: [FormNodeDirective],
   *   template: `
   *     @for (row of people; track row) {
   *       <input [formNode]="row.name" />
   *     }
   *     <button (click)="people.focus()">
   *       Focus first person
   *     </button>
   *   `,
   * })
   * export class PeoplePage {
   *   people = array({ name: field('Ada') }, {
   *     initialValue: 1,
   *   });
   * }
   * ```
   */
  focus(options?: FocusOptions): void;
  /**
   * Aggregated validation phase for this array and its item subtrees: `'valid'`, `'invalid'`, or
   * `'unknown'`.
   *
   * `'unknown'` means asynchronous validation is pending on this array or an item and no error is
   * currently available anywhere in the subtree. While unknown, `pending()` is true and both
   * `valid()` and `invalid()` are false. Any available error makes the status `'invalid'`, even if
   * other validation remains pending.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.validationStatus(); // 'valid'
   * ```
   */
  validationStatus: Signal<ValidationStatus>;
  /**
   * Whether this array or any current item subtree has been marked touched.
   *
   * ℹ️ Disabled, readonly, or hidden nodes report `false` and do not contribute touched state to ancestors.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.touched(); // false
   * ```
   */
  touched: Signal<boolean>;
  /**
   * Logical inverse of `touched()`.
   *
   * Whether neither this array nor any contributing item subtree currently reports touched state.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.untouched(); // true
   * ```
   */
  untouched: Signal<boolean>;
  /**
   * Marks this array and, by default, every interactive item subtree as touched and commits their
   * pending control values for every debounce strategy.
   *
   * This can change committed values and trigger validation and value-change callbacks,
   * even when nodes are already touched. Noninteractive subtrees ignore this operation.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.markAsTouched();
   * node.touched(); // true
   * ```
   */
  markAsTouched(options?: {
    /**
     * Skips recursively touching and committing item subtrees; this array still commits its own pending input.
     *
     * **Default:** `false`; visit interactive descendants too.
     *
     * ```ts
     * const people = array({
     *   name: field('Ada'),
     * }, { initialValue: 1 });
     * people.markAsTouched({
     *   skipDescendants: true,
     * });
     * people.touched(); // true
     * people.at(0)!.name.touched(); // false
     * ```
     */
    skipDescendants?: boolean;
  }): void;
  /**
   * Clears this node's own touched marker without changing descendant markers or values.
   * An interactive touched descendant can keep an aggregate `touched()` true. Use `reset()`
   * to clear interaction state throughout the subtree.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.markAsTouched();
   * node.markAsUntouched();
   * node.touched(); // true
   * ```
   */
  markAsUntouched(): void;
  /**
   * Whether this array currently reports user-modified state.
   *
   * This becomes `true` when the array's own state is marked dirty or an interactive item subtree
   * is dirty. Programmatic value and structural operations do not mark nodes dirty.
   * `markAsPristine()` clears only this array's own state, so a dirty item can keep the result true.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.dirty(); // false
   * ```
   */
  dirty: Signal<boolean>;
  /**
   * Logical inverse of `dirty()`.
   *
   * Whether neither this array nor any contributing item subtree currently reports user-modified state.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.pristine(); // true
   * ```
   */
  pristine: Signal<boolean>;
  /**
   * Marks this array's own state dirty, making `dirty()` true and `pristine()` false while it is interactive.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.markAsDirty();
   * node.dirty(); // true
   * ```
   */
  markAsDirty(): void;
  /**
   * Clears this array's own dirty state. `pristine()` becomes true and `dirty()` false only when no
   * contributing item remains dirty.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.markAsDirty();
   * node.markAsPristine();
   * node.dirty(); // false
   * ```
   */
  markAsPristine(): void;
  /**
   * Whether this array is effectively disabled by its own state or an ancestor reason.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.disabled(); // false
   * ```
   */
  disabled: Signal<boolean>;
  /**
   * Active inherited and local causes of this array's disabled state.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.disable('Locked');
   * node.disabledReasons()[0]?.message;
   * // 'Locked'
   * ```
   */
  disabledReasons: Signal<readonly DisabledReason[]>;
  /**
   * Logical inverse of `disabled()`.
   *
   * Whether this array has no active local or inherited disabled reason and can participate normally.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.enabled(); // true
   * ```
   */
  enabled: Signal<boolean>;
  /**
   * Disables this array subtree, optionally recording a user-facing reason.
   * Sets `disabled()` to true and `enabled()` to false on this array and its item subtrees.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.disable('Locked');
   * node.disabled(); // true
   * ```
   */
  disable(message?: string): void;
  /**
   * Clears local disabled state, including a static initial `disabled` option. Continuing
   * reactive conditions and inherited reasons remain effective, so `enabled()` may stay false.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.disable();
   * node.enable();
   * node.disabled(); // false
   * ```
   */
  enable(): void;
  /**
   * Whether this array is effectively readonly through its own state or an ancestor.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.readonly(); // false
   * ```
   */
  readonly: Signal<boolean>;
  /**
   * Logical inverse of `readonly()`.
   *
   * Whether this array accepts value changes from a control bound directly to it.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.writable(); // true
   * ```
   */
  writable: Signal<boolean>;
  /**
   * Marks this array subtree readonly, making `readonly()` true and `writable()` false throughout it.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.markAsReadonly();
   * node.readonly(); // true
   * ```
   */
  markAsReadonly(): void;
  /**
   * Clears local readonly state, including a static initial `readonly` option. Reactive
   * conditions and ancestor readonly state can still prevent the node from becoming writable.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.markAsReadonly();
   * node.markAsWritable();
   * node.readonly(); // false
   * ```
   */
  markAsWritable(): void;
  /**
   * Whether this array is effectively hidden through its own state or an ancestor.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.hidden(); // false
   * ```
   */
  hidden: Signal<boolean>;
  /**
   * Logical inverse of `hidden()`.
   *
   * Whether this array is currently intended to be shown to the user.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.visible(); // true
   * ```
   */
  visible: Signal<boolean>;
  /**
   * Hides this array subtree, making `hidden()` true and `visible()` false throughout it.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.hide();
   * node.hidden(); // true
   * ```
   */
  hide(): void;
  /**
   * Clears local hidden state, including a static initial `hidden` option. Reactive
   * conditions and ancestor hidden state can still keep the node hidden.
   *
   * ```ts
   * const node = array({
   *   name: field('Ada'),
   * }, {
   *   initialValue: 1,
   * });
   * node.hide();
   * node.show();
   * node.hidden(); // false
   * ```
   */
  show(): void;
};

/**
 * Array node model. Omit the first type argument for an unspecified structure, or provide it
 * to preserve exact item types. Generic array nodes retain array operations.
 *
 * ```ts
 * const node = array(field('Ada'), 1);
 * node(); // ['Ada']
 * ```
 */
export type ArrayNode<TItem extends AnyNode = AnyNode, TParent extends AnyNode = AnyNode> =
  & NodeSignal<ArrayValue<TItem>>
  & {
    /**
     * Returns the exposed array value, applying configured equality, and participates in signal dependency tracking.
     *
     * ```ts
     * const node = array(field('Ada'), 1);
     * node(); // ['Ada']
     * ```
     */
    (): ArrayValue<TItem>;
    /**
     * Callable, collision-safe access to the array API.
     * Calling `$api()` reads the same exposed value as the node and tracks signal dependencies.
     * Use direct members for application code and `$api` for generic code or child-name collisions.
     *
     * ```ts
     * const node = array(field('Ada'), 1);
     * node.$api.valid(); // true
     * ```
     */
    $api: CallableNodeApi<ArrayApi<TItem, TParent>>;
  }
  & ArrayIndexes<TItem, TParent>
  & ArrayApi<TItem, TParent>
  & HiddenFunctionMembers<keyof ArrayApi<TItem, TParent>>;

/**
 * Existing item node of an array, preserving its exact children and parent navigation.
 * Unlike numeric lookup or `at()`, this type excludes the missing-index `undefined` case.
 * Extract from an already inferred array; referencing a declaration from its own initializer
 * can create a circular inference dependency.
 *
 * ```ts
 * const profile = form({
 *   roles: array({ name: field('') }),
 * });
 * type RoleNode = ArrayItemNode<
 *   typeof profile.roles
 * >;
 * ```
 */
export type ArrayItemNode<TArray extends { $api: { nodeType(): 'array' }; readonly [index: number]: AnyNode | undefined }> = NonNullable<TArray[number]>;
