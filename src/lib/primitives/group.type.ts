import type { Injector, Signal } from '@angular/core';

import type { NodeSignal } from '../types/node-signal.type';
import type { GenericGroupNode } from '../types/generic-node.type';
import type { CallableNodeApi } from '../types/callable-node-api.type';
import type { NodeErrorsSignal } from '../types/node-errors-signal.type';
import type { NodeCallbackContext } from '../types/node-callback-context.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { DynamicNode, NearestForm, AnyNode, Nodes, NodeValue, RootNode } from '../types/node.type';
import type { CustomValidationError, ValidationErrorMap, ValidationStatus, ValidatorSource, ValidationErrorWithTargetNode } from '../validation/validation.type';
import type { AddedNode, FormApi, FormOptions, FormPatch, FormSet, FormValue, NodeWithParent, NormalizedNode as FormNormalizedNode, NormalizedNodes as FormNormalizedNodes, ObjectNodeDefinition, ObjectNodeDefinitionInput, ObjectNodeDefinitionInputs, ObjectNodeDefinitions } from './form.type';

/** Configuration shared by object-shaped groups, excluding form submission behavior. */
export type GroupOptions<TValue = any, TGroup extends AnyNode = GroupNode<any>> = Omit<FormOptions<TValue>, 'configure' | 'onValueChange' | 'onSubmit' | 'onSubmitBlocked' | 'submitWhen' | 'validators' | 'debounce' | 'hidden' | 'disabled' | 'readonly'> & {
  /**
   * Runs synchronously after the exposed value changes, including programmatic writes.
   * The third argument provides the node's current nearest containing array index.
   * Initialization and writes retained by `equal` do not notify. Control writes wait for debounce.
   * Callbacks run untracked, without requiring an injector or waiting for async validation.
   * Aggregate writes notify descendants before their parent, once after child updates.
   * Reentrant writes are delivered after the current callback; returned values are ignored.
   *
   * **Default:** `undefined`; no callback.
   *
   * ```ts
   * const values: unknown[] = [];
   * const node = group({ name: field('Ada') }, {
   *   onValueChange(value) {
   *     values.push(value);
   *   },
   * });
   * node.set({ name: 'Lia' });
   * values.length; // 1
   * ```
   */
  onValueChange?(value: TValue, node: TGroup, context: NodeCallbackContext): void;

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
   * group({
   *   name: field(''),
   * }, {
   *   configure(api) {
   *     api.setValidators(() => null);
   *   },
   * });
   * ```
   */
  configure?: (api: TGroup['$api']) => void;

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
   * group({
   *   name: field(''),
   * }, {
   *   validators: () => null,
   * });
   * ```
   *
   * ```ts
   * group({
   *   name: field(''),
   * }, {
   *   validators: () => ({ kind: 'blocked' }),
   * });
   * ```
   *
   * ```ts
   * group({
   *   name: field(''),
   * }, {
   *   validators: asyncValidator(async () => {
   *     await Promise.resolve();
   *     return null;
   *   }),
   * });
   * ```
   */
  validators?: ValidatorSource<TValue, TGroup>;
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
   * group({
   *   name: field(''),
   * }, {
   *   debounce: 300,
   * });
   * ```
   *
   * ```ts
   * group({
   *   name: field(''),
   * }, {
   *   debounce: 'blur',
   * });
   * ```
   *
   * ```ts
   * group({
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
   * **Return Type:** `unknown` for the callback; JavaScript truthiness determines the state.
   *
   * **Default:** `false` locally; active ancestor state still applies.
   *
   * **Accepted values:**
   *
   * - **Booleans**: Enable or clear the local configured state.
   * - **Functions**: Reevaluate tracked signal reads to derive the local state. The callback
   *   receives `context.index` for the nearest containing array item, or `null` outside arrays.
   *
   * ```ts
   * group({
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
   * group({
   *   name: field(''),
   * }, {
   *   hidden: () => active(),
   * });
   * ```
   */
  hidden?: boolean | ((context: NodeCallbackContext) => any);
  /**
   * Controls this node's local disabled state, inherited by descendants. A static string
   * disables and supplies a reason even when empty; callback strings follow truthiness.
   * Disabled nodes retain their values and accept programmatic writes; their own validation
   * and reported interaction state are suppressed. Ancestor reasons cannot be cleared locally.
   *
   * The callback return type is intentionally unchecked
   * so it can reference its containing node without a circular inference error. Add an
   * explicit return annotation when authoring a strictly checked callback. Node values
   * and state signals retain their inferred types.
   *
   * **Return Type:** `unknown` for the callback; truthy results disable the node.
   * A nonempty string also becomes a reason message.
   *
   * **Default:** `false` locally; active ancestor state still applies.
   *
   * **Accepted values:**
   *
   * - **Booleans**: Enable or clear the local configured state.
   * - **Functions**: Reevaluate tracked signal reads to derive the local state. The callback
   *   receives `context.index` for the nearest containing array item, or `null` outside arrays.
   * - **Strings**: Static strings disable locally, even when empty, and record the text
   *   in `disabledReasons()`. Callback strings do so when nonempty.
   *
   * ```ts
   * group({
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
   * group({
   *   name: field(''),
   * }, {
   *   disabled: () => active(),
   * });
   * ```
   *
   * ```ts
   * group({
   *   name: field(''),
   * }, {
   *   disabled: 'Locked',
   * });
   * ```
   */
  disabled?: boolean | string | ((context: NodeCallbackContext) => any);
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
   * **Return Type:** `unknown` for the callback; JavaScript truthiness determines the state.
   *
   * **Default:** `false` locally; active ancestor state still applies.
   *
   * **Accepted values:**
   *
   * - **Booleans**: Enable or clear the local configured state.
   * - **Functions**: Reevaluate tracked signal reads to derive the local state. The callback
   *   receives `context.index` for the nearest containing array item, or `null` outside arrays.
   *
   * ```ts
   * group({
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
   * group({
   *   name: field(''),
   * }, {
   *   readonly: () => active(),
   * });
   * ```
   */
  readonly?: boolean | ((context: NodeCallbackContext) => any);
};

/**
 * Object value produced by a group, with each child node mapped to its readable value.
 *
 * ```ts
 * const name = field('Ada');
 * const profile = group({ name });
 * const value: GroupValue<{
 *   name: typeof name;
 * }> = {
 *   name: 'Lia',
 * };
 * profile.set(value);
 * profile.name(); // 'Lia'
 * ```
 */
export type GroupValue<TNodes extends Nodes> = FormValue<TNodes>;
/**
 * Complete object accepted by a group's `set()`, recursively using each child's set type.
 *
 * ```ts
 * const name = field('Ada');
 * const profile = group({ name });
 * const value: GroupSet<{
 *   name: typeof name;
 * }> = {
 *   name: 'Lia',
 * };
 * profile.set(value);
 * profile.name(); // 'Lia'
 * ```
 */
export type GroupSet<TNodes extends Nodes> = FormSet<TNodes>;
/**
 * Partial object accepted by a group's `patch()`; omitted child properties remain unchanged and supplied arrays require complete item values.
 *
 * ```ts
 * const name = field('Ada');
 * const profile = group({ name });
 * const value: GroupPatch<{
 *   name: typeof name;
 * }> = {
 *   name: 'Lia',
 * };
 * profile.patch(value);
 * profile.name(); // 'Lia'
 * ```
 */
export type GroupPatch<TNodes extends Nodes> = FormPatch<TNodes>;

export type NormalizedNode<TNode extends ObjectNodeDefinition> = FormNormalizedNode<TNode>;

export type NormalizedNodes<TNodes extends ObjectNodeDefinitions> = FormNormalizedNodes<TNodes>;

export type GroupRoot<TNodes extends Nodes, TParent extends AnyNode> = AnyNode extends TParent
  ? GroupNode<TNodes, TParent>
  : RootNode<TParent>;

export type GroupChildren<TNodes extends Nodes, TParent extends AnyNode> = {
  readonly [K in keyof TNodes]: NodeWithParent<TNodes[K], GroupNode<TNodes, TParent>>;
};

export type GroupApi<TNodes extends Nodes, TParent extends AnyNode = AnyNode> =
  & Omit<FormApi<TNodes, TParent>, 'onValueChange' | 'setValidators' | 'children' | 'forEachChild' | 'errors' | 'allErrors' | 'form' | 'root' | 'getError' | 'add' | 'remove' | 'nodeType' | 'submit' | 'submitted' | 'submitting' | 'validationStatus'>
  & {

    /**
     * Returns the concrete primitive represented by this node.
     *
     * ```ts
     * const node = group({
     *   name: field('Ada'),
     * });
     * node.nodeType(); // 'group'
     * ```
     */
    nodeType(): 'group';
    /**
     * Subscribes to future exposed value changes and returns an idempotent cancellation function.
     * Runs untracked, respects equality and control debounce, and by default skips initial
     * values. Multiple listeners coexist with the construction callback; subscriptions are not cloned.
     * The explicit injector, otherwise the registration context, owns the listener. The node's
     * current injector also ends the subscription on destruction and acts as the fallback owner.
     * Binding and ancestor ownership follow the node when it is rebound or detached.
     * Without an injector, observation still works and can be canceled manually.
     * A positive `debounce` delays only this callback until that many milliseconds without another
     * change. Omitted or zero stays synchronous. Cancellation drops pending delivery.
     * Node values, validation, and interaction state are unaffected by the subscription delay.
     * Set `emitCurrent: true` to call only this listener synchronously with the current exposed
     * value before registration returns, even with subscription debounce. Pending control input is
     * not flushed. The read and callback run untracked; this is not a value-change event.
     * If the first call throws, registration is canceled and the error is rethrown.
     * `emitCurrent` defaults to false; later changes retain the normal notification rules.
     *
     * ```ts
     * const node = group({ name: field('Ada') });
     * const values: unknown[] = [];
     * const stop = node.onValueChange(value => {
     *   values.push(value);
     * });
     * node.patch({ name: 'Grace' });
     * values.length; // 1
     * stop();
     * ```
     *
     * ```ts
     * const node = group({ name: field('Ada') });
     * const stop = node.onValueChange(value => {
     *   console.log(value);
     * }, { debounce: 300 });
     * // Cancel pending and future delivery.
     * stop();
     * ```
     *
     * ```ts
     * const node = group({ name: field('Ada') });
     * const values: unknown[] = [];
     * const stop = node.onValueChange(value => {
     *   values.push(value);
     * }, { emitCurrent: true });
     * values.length; // 1
     * stop();
     * ```
     *
     * @param callback Receives the exposed value, original node, and current array index context after a committed change, and at registration when emitCurrent is true. Return values are ignored. Errors from later synchronous notifications propagate after other listeners are notified; debounced errors are thrown from the timer callback.
     * @param options Optional emitCurrent (default false) delivers the current value synchronously before returning. Optional debounce in finite, non-negative milliseconds (default zero); invalid delays throw RangeError. Optional subscription owner. Omission uses the registration context, falling back to the node's injector; an explicit injector does not change node ownership.
     */
    onValueChange(callback: (value: FormValue<TNodes>, node: GroupNode<TNodes, TParent>, context: NodeCallbackContext) => void, options?: { injector?: Injector; debounce?: number; emitCurrent?: boolean }): () => void;
    /**
     * Replaces this group's validators while preserving its node type in inline callbacks.
     *
     * ```ts
     * const node = group({
     *   name: field('Ada'),
     * });
     * node.setValidators(() => ({
     *   kind: 'blocked',
     * }));
     * node.invalid(); // true
     * ```
     */
    setValidators(validators: ValidatorSource<GroupValue<TNodes>, GroupNode<TNodes, TParent>>): void;
    /**
     * Readonly runtime child map. Declared properties retain exact node types; arbitrary keys use DynamicNode.
     *
     * ```ts
     * const node = group({
     *   name: field('Ada'),
     * });
     * node.children.name(); // 'Ada'
     * ```
     */
    readonly children: GroupChildren<TNodes, TParent> & Readonly<Record<string, DynamicNode>>;
    /**
     * **Dynamically added nodes are excluded by default.** Pass `{ includeDynamic: true }` to visit them.
     *
     * Visits a snapshot of declared immediate children in object-entry order without recursion.
     * The callback type is the declared-child union, or DynamicNode for an empty declaration.
     * Additions during iteration are deferred; removed snapshot entries are still visited.
     * Callback errors propagate and stop iteration.
     *
     * ```ts
     * const profile = group({
     *   name: field('Ada'),
     * });
     * const keys: string[] = [];
     * profile.forEachChild((child, key) => {
     *   keys.push(key);
     * });
     * keys; // ['name']
     * ```
     *
     * @reactive Tracks child additions and removals, plus signals read by the callback.
     */
    forEachChild(callback: (child: keyof TNodes extends never ? DynamicNode : GroupChildren<TNodes, TParent>[keyof TNodes], key: string) => void, options?: { includeDynamic?: false }): void;
    /**
     * **Dynamically added nodes are excluded unless `includeDynamic` is `true`.**
     *
     * Includes children added with `add()` when enabled. A runtime boolean uses
     * DynamicNode callbacks because added nodes may be visited. Empty declarations require true
     * to visit their added children.
     *
     * ```ts
     * const profile = group({
     *   name: field('Ada'),
     * });
     * const keys: string[] = [];
     * profile.add('age', field(36));
     * profile.forEachChild(
     *   (child, key) => {
     *     keys.push(key);
     *   },
     *   { includeDynamic: true },
     * );
     * keys; // ['name', 'age']
     * ```
     *
     * @reactive Tracks structure changes and reactive reads performed by the callback.
     */
    forEachChild(callback: (child: DynamicNode, key: string) => void, options: { includeDynamic?: boolean }): void;
    /**
     * Adds one child at runtime and returns the attached node with its exact inferred type.
     *
     * Add one named child to a group.
     *
     * ```ts
     * const filters = group({ query: field('') });
     *
     * const category = filters.add(
     *   'category',
     *   field('all'),
     * );
     * category(); // 'all'
     * filters.get('category') === category; // true
     * ```
     */
    add<TKey extends string, TDefinition>(key: TKey extends keyof TNodes | '$api' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): AddedNode<TDefinition, GroupNode<TNodes, TParent>>;
    /**
     * Adds several child definitions atomically and returns an exact keyed map of their attached
     * live nodes.
     *
     * Add several children to a group in one structural update.
     *
     * ```ts
     * const filters = group({ query: field('') });
     *
     * const added = filters.add({
     *   sort: field('relevance'),
     *   range: {
     *     minimum: field(0),
     *     maximum: field(100),
     *   },
     * });
     *
     * added.sort(); // 'relevance'
     * added.range.maximum(); // 100
     * filters.get('range') === added.range; // true
     * ```
     */
    add<TDefinitions extends ObjectNodeDefinitions>(definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions> & Partial<Record<keyof TNodes | '$api', never>>): {
      readonly [TKey in keyof TDefinitions]: AddedNode<TDefinitions[TKey], GroupNode<TNodes, TParent>>;
    };
    /**
     * Detaches a dynamically added child. Initially declared children cannot be removed.
     *
     * ```ts
     * const profile = group({
     *   name: field('Ada'),
     * });
     * profile.add('age', field(36));
     * const age = profile.remove('age');
     * age?.(); // 36
     * age?.parent(); // null
     * ```
     */
    remove(key: string): DynamicNode | undefined;
    /**
     * Nearest explicit `form()` containing this group, or `null` when no form workflow owns it.
     * A nested explicit form is the workflow owner instead of the complete structural root.
     *
     * ```ts
     * const node = group({
     *   name: field('Ada'),
     * });
     * node.form(); // null
     * ```
     */
    form: Signal<NearestForm<TParent> | null>;
    /**
     * Complete structural root containing this group. A root or detached group returns itself.
     * Use this signal when traversal must cross nested form workflow boundaries.
     *
     * ```ts
     * const node = group({
     *   name: field('Ada'),
     * });
     * node.root() === node; // true
     * ```
     */
    root: Signal<GroupRoot<TNodes, TParent>>;
    /**
     * Validation errors belonging directly to this group, excluding descendant-owned errors.
     *
     * Pass `{ descendants: true }` to read the same subtree errors as `allErrors()`.
     *
     * ```ts
     * const node = group({
     *   name: field('Ada'),
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
    errors: NodeErrorsSignal<GroupNode<TNodes, TParent>>;
    /**
     * Validation errors from this group and its complete subtree in structural order.
     *
     * Shortcut for `errors({ descendants: true })`, returning the same cached array.
     *
     * ```ts
     * const node = group({
     *   name: field('Ada'),
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
     * Returns the first validation error belonging directly to this group and matching `kind`.
     * Suggests registered error kinds while accepting any custom string.
     *
     * ```ts
     * const profile = group({
     *   name: field('', [required]),
     * });
     * profile.getError('required'); // undefined
     * profile.name.getError('required')?.kind;
     * // 'required'
     * ```
     *
     * @reactive Maintains an independent reactive computation for each `kind`.
     */
    getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationErrorWithTargetNode<GroupNode<TNodes, TParent>> & ValidationErrorMap[TKind]) | undefined;
    /**
     * Returns the first custom error belonging directly to this group and matching `kind`.
     * Suggests registered error kinds while accepting any custom string.
     *
     * ```ts
     * const node = group({
     *   name: field('Ada'),
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
    getError<TKind extends keyof ValidationErrorMap | (string & {})>(kind: TKind): (ValidationErrorWithTargetNode<GroupNode<TNodes, TParent>> & CustomValidationError<TKind>) | undefined;
    /**
     * Aggregated validation phase for this group subtree: `'valid'`, `'invalid'`, or `'unknown'`.
     *
     * `'unknown'` means asynchronous validation is pending on this group or a descendant and no
     * error is currently available in the subtree. While unknown, `pending()` is true and both
     * `valid()` and `invalid()` are false. Any available error makes the status `'invalid'`, even
     * if other validation remains pending.
     *
     * ```ts
     * const node = group({
     *   name: field('Ada'),
     * });
     * node.validationStatus(); // 'valid'
     * ```
     */
    validationStatus: Signal<ValidationStatus>;
    /**
     * Whether an ancestor form is currently running its submission action. Groups cannot initiate submission.
     *
     * ```ts
     * const node = group({
     *   name: field('Ada'),
     * });
     * node.submitting(); // false
     * ```
     */
    submitting: Signal<boolean>;
  };

type GroupApiProperty<TNodes extends Nodes, TParent extends AnyNode> = {
  /**
   * Callable, collision-safe access to the group API.
   *
   * Calling `$api()` reads the same exposed value as the node and tracks signal dependencies.
   * Child names never replace members on this API; access children through `children` when available.
   *
   * ```ts
   * const node = group({ name: field('Ada') });
   * node.$api.valid(); // true
   * ```
   */
  $api: CallableNodeApi<GroupApi<TNodes, TParent>>;
};

/**
 * An object-shaped structural node without its own submission workflow.
 * Omit the first type argument for an unspecified structure, or provide it
 * to preserve exact child types.
 *
 * **Without generic arguments, use `$api` for state and operations because child names may collide.**
 *
 * ```ts
 * const node = group({ name: field('Ada') });
 * node(); // { name: 'Ada' }
 * ```
 */
export type GroupNode<TNodes extends Nodes = never, TParent extends AnyNode = AnyNode> =
  [TNodes] extends [never] ? GenericGroupNode
    : NodeSignal<{ [K in keyof TNodes]: NodeValue<TNodes[K]> }>
  & {
    /**
     * Returns the group's exposed aggregate value after configured equality and participates in signal dependency tracking.
     *
     * ```ts
     * const node = group({ name: field('Ada') });
     * node(); // { name: 'Ada' }
     * ```
     */
    (): { [K in keyof TNodes]: NodeValue<TNodes[K]> };
  }
  & GroupApiProperty<TNodes, TParent>
  & GroupChildren<TNodes, TParent>
  & Omit<GroupApi<TNodes, TParent>, keyof TNodes>
  & HiddenFunctionMembers<keyof TNodes | keyof GroupApi<TNodes, TParent>>;
