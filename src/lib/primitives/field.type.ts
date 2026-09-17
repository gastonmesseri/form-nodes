import type { Injector, Signal } from '@angular/core';

import type { CallableNodeApi } from '../types/callable-node-api.type';
import type { NodeValueSignal } from '../types/node-value-signal.type';
import type { SyncInputName } from '../configuration/node-input-config';
import type { NodeErrorsSignal } from '../types/node-errors-signal.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { DisabledReason, NavigationRoot, NearestForm, AnyNode, NodeKeyInParent, RootNode } from '../types/node.type';
import type { CustomValidationError, ValidationErrorMap, ValidationStatus, ValidatorSource, Validators, ValidationErrorWithTargetNode } from '../validation/validation.type';

export type FieldOptions<TValue = any> = {
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
   * const node = field('Ada', {
   *   onValueChange(value) {
   *     values.push(value);
   *   },
   * });
   * node.set('Lia');
   * values.length; // 1
   * ```
   */
  onValueChange?(value: TValue, node: FieldNode<TValue>): void;

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
   * field('', {
   *   configure(api) {
   *     api.setValidators(() => null);
   *   },
   * });
   * ```
   */
  configure?: (api: FieldNode<TValue>['$api']) => void;

  /**
   * Reactively copies node state and constraints into matching custom-control inputs. This is
   * one-way node-to-component synchronization; it does not enable value binding, execute
   * validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs.
   *
   * **Default:** Omission inherits the next configuration layer; the final fallback is `false`.
   *
   * **Accepted values:**
   *
   * - `false` or `null`: no additional input writes, even if inherited configuration enables them.
   * - `'declared'`: initial `disabled`, `readonly`, and `hidden` node options select their inputs.
   *   Explicit false counts; undefined does not. Declaring disabled also selects disabledReasons.
   *   Validators never select inputs in this preset, including initial built-in validators.
   * - `'all'`: every supported input exposed by the selected control, including validator constraints.
   * - `'signal-controls'`: all supported inputs, only when the selected adapter connects an actual
   *   `value` or `checked` model. A CVA takes precedence even if its component also exposes a model.
   * - `['disabled', 'required']`: exactly those supported inputs, regardless of initial declarations.
   * - `{ inputs, target }`: inputs is `'declared'`, `'all'`, or a list; target is `'all'` (default),
   *   `'signal-controls'`, or `'cva'`. Target filters the selected adapter; it never changes priority.
   *   The signal-controls preset is shorthand for `{ inputs: 'all', target: 'signal-controls' }`.
   * - `[]` or `{ inputs: [] }`: no additional writes. Empty lists never enable value connections.
   *
   * Provider and global defaults are captured on connection. Node options override providers;
   * parent node options do not configure descendants. Lists and objects replace inherited selections.
   * Rebinding applies the new selection; inputs no longer selected retain their last values.
   *
   * Selected writes may replace component defaults and explicit template bindings. CVA value and
   * disabled-state integration remain independent. Use {@link useFormNodeState} for state observation.
   *
   * ```ts
   * field('Ada', {
   *   syncInputs: false,
   * });
   * ```
   *
   * ```ts
   * field('Ada', {
   *   syncInputs: 'declared',
   * });
   * ```
   *
   * ```ts
   * field('Ada', {
   *   syncInputs: 'all',
   * });
   * ```
   *
   * ```ts
   * field('Ada', {
   *   syncInputs: 'signal-controls',
   * });
   * ```
   *
   * ```ts
   * field('Ada', {
   *   syncInputs: ['required', 'minLength'],
   * });
   * ```
   *
   * ```ts
   * field('Ada', {
   *   syncInputs: {
   *     inputs: ['required'],
   *     target: 'cva',
   *   },
   * });
   * ```
   *
   * @experimental Custom-control input writes depend on Angular internals.
   * @see {@link https://form-nodes.js.org/reference/provide-form-nodes-config | Binding configuration}
   */
  syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | { inputs: 'declared' | 'all' | readonly SyncInputName[]; target?: 'all' | 'signal-controls' | 'cva' | undefined } | null | undefined;

  /**
   * Connects recognized value/valueChange or checked/checkedChange input/output pairs.
   * CVAs and actual model signals keep priority. Enabling a pair connects values and interaction
   * hooks; optional state inputs are selected independently by `syncInputs`.
   *
   * **Default:** Omission inherits the next configuration layer; the final fallback is `false`.
   *
   * **Accepted values:**
   *
   * - `true`: Connect the pair, including touch and optional focus/reset/node hooks.
   * - `false` or `null`: Disable pair connections, overriding inherited settings.
   * - `undefined`: Inherit factory, provider, or global configuration as applicable.
   *
   * Provider/global defaults are captured on connection; parent node options do not configure
   * descendants. Rebinding releases old subscriptions and node references. Inactive pairs retain
   * component input values, so use initialized inputs rather than required inputs.
   *
   * ```ts
   * field('Ada', {
   *   bindInputOutputPairs: true,
   * });
   * ```
   *
   * ```ts
   * field('Ada', {
   *   bindInputOutputPairs: false,
   * });
   * ```
   *
   * @experimental Custom-control input writes depend on Angular internals.
   * @see {@link https://form-nodes.js.org/reference/provide-form-nodes-config | Binding configuration}
   */
  bindInputOutputPairs?: boolean | null | undefined;
  /**
   * Compares exposed values and retains the previous exposed value when they are equal.
   * Validators, submission, and `update()` read that exposed value. Committed storage and
   * controls still accept new writes. The comparator is captured at construction and runs
   * untracked when the exposed computed value evaluates; comparison errors propagate.
   *
   * **Default:** `Object.is`.
   *
   * **Accepted values:**
   *
   * - `shallow`: Compare the immediate supported container contents.
   * - `deep`: Compare supported nested containers recursively.
   * - **Functions**: Return `true` to keep the previous exposed value.
   *
   * ```ts
   * field('', {
   *   equal: 'shallow',
   * });
   * ```
   *
   * ```ts
   * field('', {
   *   equal: 'deep',
   * });
   * ```
   *
   * ```ts
   * field('', {
   *   equal: (previous, next) => {
   *     return previous === next;
   *   },
   * });
   * ```
   */
  equal?: 'deep' | 'shallow' | ((previous: TValue, next: TValue) => boolean);
  /**
   * Registers rules on this node's exposed value. Aggregate rules receive the complete
   * object or array; put per-field rules on children. A synchronous composition may return
   * validators; asynchronous rules must be wrapped with `asyncValidator()`.
   * Null and undefined entries are ignored. Contexts are typed; inline returns intentionally
   * allow self-reference inference. Use `validator()` or an explicit result annotation
   * when returned errors also need strict checking.
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
   * field('', {
   *   validators: required,
   * });
   * ```
   *
   * ```ts
   * field('', {
   *   validators: ({ value }) => {
   *     return value() === null
   *       ? { kind: 'missing' }
   *       : null;
   *   },
   * });
   * ```
   *
   * ```ts
   * field('', {
   *   validators: asyncValidator(async () => {
   *     await Promise.resolve();
   *     return null;
   *   }),
   * });
   * ```
   */
  validators?: ValidatorSource<TValue, FieldNode<TValue>>;
  /**
   * Provides an explicit owner for injector-dependent work, including async-validator watchers.
   * Without one, construction captures the current injection context when available;
   * binding adoption and ancestor inheritance provide temporary fallback ownership.
   * Standalone nodes remain usable without dependency injection.
   *
   * **Default:** `undefined`; resolve ownership from the construction or attachment context.
   *
   * See {@link FieldOptions.inheritInjector} and {@link FieldOptions.adoptBindingInjector}.
   *
   * ```ts
   * import { Injector } from '@angular/core';
   *
   * const owner = Injector.create({
   *   providers: [],
   * });
   * field('', {
   *   injector: owner,
   * });
   * owner.destroy();
   * ```
   */
  injector?: Injector;
  /**
   * Allows an otherwise unowned node to inherit its nearest ancestor injector.
   * An explicit or construction-time injector takes precedence. Setting `false` creates
   * an ancestor boundary; it does not disable an injector already owned by this node.
   *
   * **Default:** `true`.
   *
   * ```ts
   * field('', {
   *   inheritInjector: false,
   * });
   * ```
   */
  inheritInjector?: boolean;
  /**
   * Allows an otherwise unowned node to borrow the injector of its directly bound
   * `[formNode]` host. This binding owner takes precedence over an inherited ancestor.
   * The lease ends on rebinding or destruction. Explicit and construction-time owners
   * still take precedence. Setting `false` prevents only direct binding adoption.
   *
   * **Default:** `true`.
   *
   * ```ts
   * field('', {
   *   adoptBindingInjector: false,
   * });
   * ```
   */
  adoptBindingInjector?: boolean;
  /**
   * Delays control-originated value commits. Programmatic writes commit immediately. A later edit aborts
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
   * field('', {
   *   debounce: 300,
   * });
   * ```
   *
   * ```ts
   * field('', {
   *   debounce: 'blur',
   * });
   * ```
   *
   * ```ts
   * field('', {
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
   * **Default:** `false` locally; active ancestor state still applies.
   *
   * **Accepted values:**
   *
   * - **Booleans**: Enable or clear the local configured state.
   * - **Functions**: Reevaluate tracked signal reads to derive the local state.
   *
   * ```ts
   * field('', {
   *   hidden: true,
   * });
   * ```
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const active = signal(false);
   * field('', {
   *   hidden: () => active(),
   * });
   * ```
   */
  hidden?: boolean | (() => boolean);
  /**
   * Controls this node's local disabled state, inherited by descendants. A string disables
   * the node and contributes a user-facing reason, including an empty string.
   * Disabled nodes retain their values and accept programmatic writes; their own validation
   * and reported interaction state are suppressed. Ancestor reasons cannot be cleared locally.
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
   * field('', {
   *   disabled: true,
   * });
   * ```
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const active = signal(false);
   * field('', {
   *   disabled: () => active(),
   * });
   * ```
   *
   * ```ts
   * field('', {
   *   disabled: 'Locked',
   * });
   * ```
   */
  disabled?: boolean | string | (() => boolean | string);
  /**
   * Controls this node's local readonly state. Descendants inherit active readonly state.
   * It prevents control-originated edits, not programmatic writes. Readonly nodes suppress
   * their own validation and reported dirty/touched state without discarding stored interaction.
   *
   * **Default:** `false` locally; active ancestor state still applies.
   *
   * **Accepted values:**
   *
   * - **Booleans**: Enable or clear the local configured state.
   * - **Functions**: Reevaluate tracked signal reads to derive the local state.
   *
   * ```ts
   * field('', {
   *   readonly: true,
   * });
   * ```
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const active = signal(false);
   * field('', {
   *   readonly: () => active(),
   * });
   * ```
   */
  readonly?: boolean | (() => boolean);
};

export type FieldApi<TValue, TParent extends AnyNode = AnyNode> = {
  /**
   * Returns the concrete primitive represented by this node.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.nodeType(); // 'field'
   * ```
   */
  nodeType(): 'field';
  /**
   * Nearest explicit `form()` containing this field, or `null` when no form workflow owns it.
   * A nested explicit form is the workflow owner instead of the complete structural root.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.form() === profile; // true
   * ```
   */
  form: Signal<NearestForm<TParent> | null>;
  /**
   * Complete structural root containing this field. A standalone or detached field returns itself.
   * Use this signal when traversal must cross nested form workflow boundaries.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.root() === profile; // true
   * ```
   */
  root: Signal<AnyNode extends TParent ? NavigationRoot : RootNode<TParent>>;
  /**
   * Immediate structural parent of this field, or `null` when it is a root or has been detached.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.parent() === profile; // true
   * ```
   */
  parent: Signal<TParent | null>;
  /**
   * Property and array-index segments from the complete root to this field. Root fields use `[]`.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.path(); // ['name']
   * ```
   */
  path: Signal<readonly string[]>;
  /**
   * Property or array index under which this field is stored, or `null` when it is a root field.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.keyInParent(); // 'name'
   * ```
   */
  keyInParent: Signal<NodeKeyInParent<TParent>>;
  /**
   * Exposed field value. The `equal` option may retain an earlier equivalent value independently
   * of the latest committed write used by controls and reset.
   *
   * `value.committed()` reads committed data before configured equality; `value.control()` also
   * includes this node's pending input. Their `set()` methods perform committed/control writes.
   * See {@link NodeValueSignal} for debounce, aggregate, validation, and interaction semantics.
   *
   * Prefer calling the field directly instead of using `name.value()` for ordinary value reads:
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name(); // 'Ada'
   * ```
   */
  value: NodeValueSignal<TValue, TValue>;
  /**
   * Assigns a committed value immediately without marking the field dirty.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.set('Lia');
   * profile.name(); // 'Lia'
   * ```
   */
  set(value: TValue): void;
  /**
   * Computes and sets a complete value from the current exposed value without marking the field dirty.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.update(name => `${name}!`);
   * profile.name(); // 'Ada!'
   * ```
   */
  update(updater: (value: TValue) => TValue): void;
  /**
   * Whether a control-originated value is waiting to be committed by this field's numeric,
   * blur-based, or asynchronous debounce. Programmatic writes do not activate this signal.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.debouncing(); // false
   * ```
   */
  debouncing: Signal<boolean>;
  /**
   * Immediately commits the pending value.control(), ending its configured debounce. Has no observable effect when no control update is pending.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada', { debounce: 'blur' }),
   * });
   * profile.name.value.control.set('Lia');
   * profile.name.flush();
   * profile.name(); // 'Lia'
   * ```
   */
  flush(): void;
  /**
   * Focuses the first `[formNode]` control currently bound to this field in DOM order.
   *
   * - **Native controls:** calls `focus(options)` on the bound `input`, `select`, or `textarea`.
   * - **Signal custom controls:** calls the component's optional `focus(options)` hook. When the
   *   component does not implement that hook, focuses its host element instead.
   * - **ControlValueAccessor controls:** focuses the component's host element.
   * - **Multiple bindings:** focuses whichever bound element appears first in the DOM.
   * - **No binding:** does nothing.
   *
   * `FocusOptions` are forwarded unchanged to the selected native element or custom focus hook.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   imports: [FormNodeDirective],
   *   template: `
   *     <input [formNode]="profile.name" />
   *     <button (click)="profile.name.focus()">
   *       Focus name
   *     </button>
   *   `,
   * })
   * export class ProfilePage {
   *   profile = form({ name: field('Ada') });
   * }
   * ```
   */
  focus(options?: FocusOptions): void;
  /**
   * Assigns a committed value like `set()`. Available through `$api` for generic infrastructure; ordinary field updates use `set()`.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.$api.patch('Lia');
   * profile.name(); // 'Lia'
   * ```
   */
  patch(value: TValue): void;
  /**
   * Clears touched and dirty state and cancels pending control input. Passing a value also replaces
   * internally committed value; omitting it preserves that value even when `equal` retains an older
   * exposed value. Controls reset to the internally committed value.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.set('Lia');
   * profile.name.markAsDirty();
   * profile.name.reset();
   * profile.name(); // 'Lia'
   * profile.name.dirty(); // false
   * ```
   */
  reset(...args: [] | [value: TValue]): void;
  /**
   * Restores the field's captured initial value and resets its interaction state.
   *
   * Unlike reset(), this replaces the current value. Unlike reset(value), it does not need a value
   * argument. Omitted initialization restores null; explicit undefined initialization restores
   * undefined. For newly created array items, the effective item initialization value takes
   * precedence over the field template's default.
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
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.set('Lia');
   * profile.name.resetToInitial();
   * profile.name(); // 'Ada'
   * ```
   */
  resetToInitial(): void;
  /**
   * Current normalized validators assigned directly to this field, in declaration order.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const rule = validator(() => null);
   * profile.name.setValidators(rule);
   * profile.name.validators()[0] === rule;
   * // true
   * ```
   */
  validators: Signal<Validators<TValue>> & {
    /**
     * Resolves returned synchronous compositions; async validators remain unexecuted references.
     *
     * ```ts
     * const profile = form({
     *   name: field('Ada'),
     * });
     * const rule = validator(() => null);
     * profile.name.setValidators(() => [rule]);
     * profile.name.validators({
     *   resolve: true,
     * })[0] === rule; // true
     * ```
     *
     * @reactive Tracks composition dependencies and shares synchronous validation evaluation.
     */
    (options: { resolve?: boolean }): Validators<TValue>;
  };
  /**
   * Replaces this field's validators and immediately validates the current exposed value.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * profile.name.invalid(); // true
   * ```
   */
  setValidators(validators: ValidatorSource<TValue, FieldNode<TValue>>): void;
  /**
   * A signal containing the validation errors of **this field itself**.
   *
   * ℹ️ To work consistently with aggregate nodes, use `allErrors()` instead.
   *
   * Pass `{ descendants: true }` to read the same subtree errors as `allErrors()`.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * profile.name.errors()
   *   .map(error => error.kind);
   * // ['blocked']
   * ```
   *
   * @reactive Tracks own errors by default, or subtree errors when descendants is true.
   */
  errors: NodeErrorsSignal<FieldNode<TValue, TParent>>;
  /**
   * A signal containing the validation errors of **this field and its descendants**.
   * Fields have no descendants, so this contains the same errors as `errors()`.
   *
   * ℹ️ To read only errors belonging directly to the current node, use `errors()` instead.
   *
   * Shortcut for `errors({ descendants: true })`, returning the same cached array.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * profile.name.allErrors()
   *   .map(error => error.kind);
   * // ['blocked']
   * ```
   */
  allErrors: Signal<readonly ValidationErrorWithTargetNode<AnyNode>[]>;
  /**
   * Whether this field has completed validation without errors. False while validity is unknown.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.valid(); // true
   * ```
   */
  valid: Signal<boolean>;
  /**
   * Whether this field currently has at least one validation error.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.invalid(); // false
   * ```
   */
  invalid: Signal<boolean>;
  /**
   * Returns the first validation error of this field matching `kind`.
   *
   * ```ts
   * const node = field('', [required]);
   * node.getError('required')?.kind;
   * // 'required'
   * ```
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationErrorWithTargetNode<FieldNode<TValue, TParent>> & ValidationErrorMap[TKind]) | undefined;
  /**
   * Returns the first custom error belonging directly to this field and matching `kind`.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * profile.name.getError('blocked')?.kind;
   * // 'blocked'
   * ```
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends string>(kind: TKind): (ValidationErrorWithTargetNode<FieldNode<TValue, TParent>> & CustomValidationError<TKind>) | undefined;
  /**
   * Whether this node's own errors contain the given kind. Does not search descendants.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * profile.name.hasError('blocked'); // true
   * ```
   *
   * @reactive Memoizes by kind and tracks the node's current errors.
   */
  hasError(kind: string): boolean;
  /**
   * Whether the same validator function is directly registered on this node, including async validators.
   * By default, does not run validators. Set resolve to true to inspect resolved leaf references.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const rule = validator(() => null);
   * profile.name.setValidators(rule);
   * profile.name.hasValidator(rule); // true
   * ```
   *
   * @reactive Memoizes by function identity and resolution mode; resolved queries track composition dependencies.
   */
  hasValidator(validator: (context: any) => unknown, options?: { resolve?: boolean }): boolean;
  /**
   * Strictest minimum value contributed by active numeric or date validators, or `null` when absent.
   *
   * ```ts
   * const profile = form({
   *   value: field(18, [min(18)]),
   * });
   * profile.value.min(); // 18
   * ```
   */
  min: Signal<NonNullable<TValue> | null>;
  /**
   * Strictest maximum value contributed by active numeric or date validators, or `null` when absent.
   *
   * ```ts
   * const profile = form({
   *   value: field(18, [max(65)]),
   * });
   * profile.value.max(); // 65
   * ```
   */
  max: Signal<NonNullable<TValue> | null>;
  /**
   * Strictest minimum length contributed by active length validators, or `null` when absent.
   *
   * ```ts
   * const profile = form({
   *   value: field('Ada', [minLength(3)]),
   * });
   * profile.value.minLength(); // 3
   * ```
   */
  minLength: Signal<number | null>;
  /**
   * Strictest maximum length contributed by active length validators, or `null` when absent.
   *
   * ```ts
   * const profile = form({
   *   value: field('Ada', [maxLength(20)]),
   * });
   * profile.value.maxLength(); // 20
   * ```
   */
  maxLength: Signal<number | null>;
  /**
   * Every regular expression contributed by the field's active pattern validators.
   *
   * ```ts
   * const profile = form({
   *   value: field('Ada', [pattern(/^[a-z]+$/)]),
   * });
   * profile.value.pattern().length; // 1
   * ```
   */
  pattern: Signal<readonly RegExp[]>;
  /**
   * Whether an active required validator currently marks this field as required.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.required(); // false
   * ```
   */
  required: Signal<boolean>;
  /**
   * Whether this field has one or more active asynchronous validation operations.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.pending(); // false
   * ```
   */
  pending: Signal<boolean>;
  /**
   * Whether an ancestor form is currently running its submission action.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.submitting(); // false
   * ```
   */
  submitting: Signal<boolean>;
  /**
   * Current validation phase: `'valid'`, `'invalid'`, or `'unknown'`.
   *
   * `'unknown'` means asynchronous validation is pending and no validation error is currently
   * available. While unknown, `pending()` is true and both `valid()` and `invalid()` are false. If
   * an error becomes available while other validation remains pending, the status is `'invalid'`.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.validationStatus(); // 'valid'
   * ```
   */
  validationStatus: Signal<ValidationStatus>;
  /**
   * Whether this field has been marked touched.
   *
   * ℹ️ A disabled, readonly, or hidden field reports `false` without discarding its stored touched state.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.touched(); // false
   * ```
   */
  touched: Signal<boolean>;
  /**
   * Logical inverse of `touched()`.
   *
   * Whether this field currently reports that it has not been touched.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.untouched(); // true
   * ```
   */
  untouched: Signal<boolean>;
  /**
   * Marks this field as touched and commits its pending control value for every debounce strategy
   * while it is interactive.
   *
   * This can change the committed value and trigger validation and value-change callbacks,
   * even when the field is already touched. Noninteractive fields ignore this operation.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.markAsTouched();
   * profile.name.touched(); // true
   * ```
   */
  markAsTouched(options?: {
    /**
     * Accepted for API consistency; fields have no descendants, so this never skips their own pending-value commit.
     *
     * **Default:** `false`; either value touches and commits this field.
     *
     * ```ts
     * const profile = form({
     *   name: field('Ada', { debounce: 'blur' }),
     * });
     * profile.name.value.control.set('Lia');
     * profile.name.markAsTouched({
     *   skipDescendants: true,
     * });
     * profile.name(); // 'Lia'
     * profile.name.touched(); // true
     * ```
     */
    skipDescendants?: boolean;
  }): void;
  /**
   * Clears stored touched state, making `touched()` false and `untouched()` true.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.markAsTouched();
   * profile.name.markAsUntouched();
   * profile.name.touched(); // false
   * ```
   */
  markAsUntouched(): void;
  /**
   * Whether this field currently reports user-modified state.
   *
   * A control-originated value or `markAsDirty()` records dirty state. Programmatic `set()` and
   * `update()` calls do not. A disabled, readonly, or hidden field reports `false` until it becomes
   * interactive again, without discarding the stored state.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.dirty(); // false
   * ```
   */
  dirty: Signal<boolean>;
  /**
   * Logical inverse of `dirty()`.
   *
   * Whether this field currently reports that it has not been modified through user interaction.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.pristine(); // true
   * ```
   */
  pristine: Signal<boolean>;
  /**
   * Marks this field as dirty, making `dirty()` true and `pristine()` false while it is interactive.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.markAsDirty();
   * profile.name.dirty(); // true
   * ```
   */
  markAsDirty(): void;
  /**
   * Clears stored dirty state, making `dirty()` false and `pristine()` true.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.markAsDirty();
   * profile.name.markAsPristine();
   * profile.name.dirty(); // false
   * ```
   */
  markAsPristine(): void;
  /**
   * Whether this field is effectively disabled by its own state or an ancestor reason.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.disabled(); // false
   * ```
   */
  disabled: Signal<boolean>;
  /**
   * Active inherited and local causes of this field's disabled state.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.disable('Locked');
   * profile.name.disabledReasons()[0]?.message;
   * // 'Locked'
   * ```
   */
  disabledReasons: Signal<readonly DisabledReason[]>;
  /**
   * Logical inverse of `disabled()`.
   *
   * Whether this field has no active local or inherited disabled reason and can participate normally.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.enabled(); // true
   * ```
   */
  enabled: Signal<boolean>;
  /**
   * Disables this field, optionally recording a user-facing reason.
   * Sets `disabled()` to true and `enabled()` to false.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.disable('Locked');
   * profile.name.disabled(); // true
   * ```
   */
  disable(message?: string): void;
  /**
   * Clears local disabled state, including a static initial `disabled` option. Continuing
   * reactive conditions and inherited reasons remain effective, so `enabled()` may stay false.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.disable();
   * profile.name.enable();
   * profile.name.disabled(); // false
   * ```
   */
  enable(): void;
  /**
   * Whether this field is effectively readonly through its own state or an ancestor.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.readonly(); // false
   * ```
   */
  readonly: Signal<boolean>;
  /**
   * Logical inverse of `readonly()`.
   *
   * Whether this field accepts value changes from a bound UI control.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.writable(); // true
   * ```
   */
  writable: Signal<boolean>;
  /**
   * Marks this field readonly, making `readonly()` true and `writable()` false.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.markAsReadonly();
   * profile.name.readonly(); // true
   * ```
   */
  markAsReadonly(): void;
  /**
   * Clears local readonly state, including a static initial `readonly` option. Reactive
   * conditions and ancestor readonly state can still prevent the node from becoming writable.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.markAsReadonly();
   * profile.name.markAsWritable();
   * profile.name.readonly(); // false
   * ```
   */
  markAsWritable(): void;
  /**
   * Whether this field is effectively hidden through its own state or an ancestor.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.hidden(); // false
   * ```
   */
  hidden: Signal<boolean>;
  /**
   * Logical inverse of `hidden()`.
   *
   * Whether this field is currently intended to be shown to the user.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.visible(); // true
   * ```
   */
  visible: Signal<boolean>;
  /**
   * Hides this field, making `hidden()` true and `visible()` false without changing its value.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.hide();
   * profile.name.hidden(); // true
   * ```
   */
  hide(): void;
  /**
   * Clears local hidden state, including a static initial `hidden` option. Reactive
   * conditions and ancestor hidden state can still keep the node hidden.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.hide();
   * profile.name.show();
   * profile.name.hidden(); // false
   * ```
   */
  show(): void;
};

/**
 * A field node. Omit TValue for an unspecified value, or supply it to constrain reads and writes.
 *
 * ```ts
 * const node = field('Ada');
 * node(); // 'Ada'
 * ```
 */
export type FieldNode<TValue = any, TParent extends AnyNode = AnyNode> =
  & Signal<TValue>
  & {
    /**
     * Returns the field's exposed value after configured equality and participates in signal dependency tracking.
     *
     * ```ts
     * const node = field('Ada');
     * node(); // 'Ada'
     * ```
     */
    (): TValue;
    /**
     * Callable, collision-safe access to the field API.
     * Calling `$api()` reads the same exposed value as the node and tracks signal dependencies.
     * Use direct members for application code and `$api` for generic code or child-name collisions.
     *
     * ```ts
     * const node = field('Ada');
     * node.$api.valid(); // true
     * ```
     */
    $api: CallableNodeApi<FieldApi<TValue, TParent>>;
  }
  & Omit<FieldApi<TValue, TParent>, 'patch'>
  & HiddenFunctionMembers;
