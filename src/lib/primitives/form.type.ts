import type { Injector, Signal } from '@angular/core';

import type { FieldNode } from './field.type';
import type { GroupNode } from './group.type';
import type { ArrayNode } from './array.type';
import type { NodeSignal } from '../types/node-signal.type';
import type { GenericFormNode } from '../types/generic-node.type';
import type { CallableNodeApi } from '../types/callable-node-api.type';
import type { NodeValueSignal } from '../types/node-value-signal.type';
import type { SyncInputName } from '../configuration/node-input-config';
import type { NodeErrorsSignal } from '../types/node-errors-signal.type';
import type { ValidatorMessages } from '../validation/validator-messages';
import type { AngularControlLike } from './utils/angular-control-like.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { DisabledReason, DynamicNode, AnyNode, NodeKeyInParent, NodePatch, NodeSet, Nodes, NodeValue, RootNode } from '../types/node.type';
import type { CustomValidationError, ValidationErrorMap, ValidationStatus, ValidatorSource, Validators, ValidationErrorWithTargetNode, ValidationErrorWithOptionalTargetNode } from '../validation/validation.type';

/** Values inferred as concise `field()` definitions inside an object node. */
export type FieldShorthand = string | number | boolean | bigint | symbol | null | undefined | Date | readonly unknown[] | ((...args: any[]) => any);

/** One child definition accepted by `form()` and `group()`. */
export type ObjectNodeDefinition = AnyNode | FieldShorthand | ObjectNodeDefinitions;

/** Recursive definitions accepted by `form()` and `group()`. Array values normalize to fields. */
export interface ObjectNodeDefinitions {
  [key: string]: unknown;
}

/** Validates one inferred object-node child definition while preserving its original type. */
export type ObjectNodeDefinitionInput<TDefinition> =
  TDefinition extends AnyNode ? TDefinition
    : TDefinition extends AngularControlLike ? never
      : TDefinition extends FieldShorthand ? TDefinition
        : TDefinition extends ObjectNodeDefinitions ? ObjectNodeDefinitionInputs<TDefinition>
          : TDefinition;

/** Validates an inferred map of object-node child definitions. */
export type ObjectNodeDefinitionInputs<TDefinitions extends ObjectNodeDefinitions> = {
  [TKey in keyof TDefinitions]: TKey extends symbol ? never
    : TKey extends '$api' ? never
      : unknown extends TDefinitions[TKey] ? TDefinitions[TKey]
        : ObjectNodeDefinitionInput<TDefinitions[TKey]>;
};

type WidenFieldShorthand<TValue> =
  TValue extends never[] ? unknown[]
    : TValue extends readonly [] ? readonly unknown[]
      : TValue extends string ? string
        : TValue extends number ? number
          : TValue extends boolean ? boolean
            : TValue extends bigint ? bigint
              : TValue extends symbol ? symbol
                : TValue;

export type FormOptions<TValue = any, TForm extends AnyNode = FormNode<any>> = {
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
   * const node = form({ name: field('Ada') }, {
   *   onValueChange(value) {
   *     values.push(value);
   *   },
   * });
   * node.set({ name: 'Lia' });
   * values.length; // 1
   * ```
   */
  onValueChange?(value: TValue, node: TForm): void;

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
   * form({
   *   name: field(''),
   * }, {
   *   configure(api) {
   *     api.setValidators(() => null);
   *   },
   * });
   * ```
   */
  configure?: (api: TForm['$api']) => void;

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
   * form({
   *   name: field('Ada'),
   * }, {
   *   syncInputs: false,
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field('Ada'),
   * }, {
   *   syncInputs: 'declared',
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field('Ada'),
   * }, {
   *   syncInputs: 'all',
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field('Ada'),
   * }, {
   *   syncInputs: 'signal-controls',
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field('Ada'),
   * }, {
   *   syncInputs: ['required', 'minLength'],
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field('Ada'),
   * }, {
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
   * form({
   *   name: field('Ada'),
   * }, {
   *   bindInputOutputPairs: true,
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field('Ada'),
   * }, {
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
   * form({
   *   name: field(''),
   * }, {
   *   equal: 'shallow',
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field(''),
   * }, {
   *   equal: 'deep',
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field(''),
   * }, {
   *   equal: (previous, next) => {
   *     return previous === next;
   *   },
   * });
   * ```
   */
  equal?: 'shallow' | 'deep' | ((previous: TValue, next: TValue) => boolean);

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
   * form({
   *   name: field(''),
   * }, {
   *   validators: () => null,
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field(''),
   * }, {
   *   validators: () => ({ kind: 'blocked' }),
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field(''),
   * }, {
   *   validators: asyncValidator(async () => {
   *     await Promise.resolve();
   *     return null;
   *   }),
   * });
   * ```
   */
  validators?: ValidatorSource<TValue, TForm>;
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
   * form({
   *   name: field(''),
   * }, {
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
   * form({
   *   name: field(''),
   * }, {
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
   * form({
   *   name: field(''),
   * }, {
   *   adoptBindingInjector: false,
   * });
   * ```
   */
  adoptBindingInjector?: boolean;
  /**
   * Overrides built-in validator messages for this scope and its descendants.
   * An explicit validator message takes precedence. Returning `undefined` from the catalog
   * or a selected message continues to ancestor, provider, global, and built-in fallbacks.
   * Signals are tracked while the corresponding failing validator resolves its message.
   *
   * **Default:** `undefined`; inherit the surrounding message catalogs.
   *
   * See {@link ValidatorMessages} for error-specific callback parameters.
   *
   * ```ts
   * const profile = form({
   *   name: field('', [required]),
   * }, {
   *   validatorMessages: {
   *     required: 'Enter a value.',
   *   },
   * });
   * profile.name.getError('required')?.message;
   * // 'Enter a value.'
   * ```
   */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined);
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
   * form({
   *   name: field(''),
   * }, {
   *   debounce: 300,
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field(''),
   * }, {
   *   debounce: 'blur',
   * });
   * ```
   *
   * ```ts
   * form({
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
   * form({
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
   * form({
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
   * form({
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
   * form({
   *   name: field(''),
   * }, {
   *   disabled: () => active(),
   * });
   * ```
   *
   * ```ts
   * form({
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
   * form({
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
   * form({
   *   name: field(''),
   * }, {
   *   readonly: () => active(),
   * });
   * ```
   */
  readonly?: boolean | (() => any);
  /**
   * Handles permitted submissions with the exposed value snapshot and this form.
   * Return void/null for success, or an error/error array to reject the attempt.
   * Untargeted errors belong to this form. Errors clear on target edits/reset or retry;
   * obsolete async responses are ignored. Rejections and thrown exceptions propagate.
   * Only one submission runs at a time.
   *
   * **Default:** `undefined`; `submit()` has no submission handler to run.
   *
   * See {@link FormOptions.submitWhen} and {@link ValidationErrorWithOptionalTargetNode}.
   *
   * ```ts
   * form({
   *   name: field(''),
   * }, {
   *   onSubmit(value) {
   *     console.log(value.name);
   *   },
   * });
   * ```
   *
   * ```ts
   * form({
   *   name: field(''),
   * }, {
   *   onSubmit() {
   *     return { kind: 'serverRejected' };
   *   },
   * });
   * ```
   */
  onSubmit?(value: TValue, form: TForm): void | null | ValidationErrorWithOptionalTargetNode<AnyNode> | readonly ValidationErrorWithOptionalTargetNode<AnyNode>[] | PromiseLike<void | null | ValidationErrorWithOptionalTargetNode<AnyNode> | readonly ValidationErrorWithOptionalTargetNode<AnyNode>[]>;
  /**
   * Runs when validation blocks a submission, including pending validation under `valid`.
   * Does not run for concurrent attempts or when `onSubmit` is absent. Native attempts
   * emit `formNodeSubmitBlocked` first; that output also works without a submission handler.
   *
   * **Default:** `undefined`; no blocked-submission callback.
   *
   * ```ts
   * const profile = form({
   *   name: field('', [required]),
   * }, {
   *   onSubmit() {},
   *   onSubmitBlocked(node) {
   *     node.focus();
   *   },
   * });
   * await profile.submit(); // false
   * ```
   */
  onSubmitBlocked?(form: TForm): void;
  /**
   * Selects the validation gate for submission. Pending validation is checked immediately
   * and is not awaited. This option never disables validators.
   *
   * **Default:** `'not-invalid'`.
   *
   * **Accepted values:**
   *
   * - `not-invalid`: Allow valid or unknown status, including pending validation.
   * - `valid`: Require completed validation with no errors.
   * - `always`: Bypass the validity gate.
   *
   * ```ts
   * form({
   *   name: field(''),
   * }, {
   *   submitWhen: 'valid',
   *   onSubmit() {},
   * });
   * ```
   */
  submitWhen?: 'valid' | 'not-invalid' | 'always';
};

/**
 * Object value produced by a form, with each child node mapped to its readable value.
 *
 * ```ts
 * const name = field('Ada');
 * const profile = form({ name });
 * const value: FormValue<{
 *   name: typeof name;
 * }> = {
 *   name: 'Lia',
 * };
 * profile.set(value);
 * profile.name(); // 'Lia'
 * ```
 */
export type FormValue<TNodes extends Nodes> = {
  [K in keyof TNodes]: NodeValue<TNodes[K]>;
};

/**
 * Structural contract for checking a form or group against an aggregate value type without
 * replacing its inferred child-node types.
 *
 * Validate a named model while preserving an `ArrayNode` child.
 *
 * ```ts
 * type Profile = {
 *   username: string | null;
 *   items: (string | null)[];
 * };
 *
 * const profile = form({
 *   username: field(''),
 *   items: array(field('')),
 * }) satisfies FormValueContract<Profile>;
 *
 * profile.items.push('Angular');
 * ```
 */
export type FormValueContract<TValue extends object> = {
  (): TValue;
  value: Signal<TValue>;
};

/**
 * Complete object accepted by a form's `set()`, recursively using each child's set type.
 *
 * ```ts
 * const name = field('Ada');
 * const profile = form({ name });
 * const value: FormSet<{ name: typeof name }> =
 *   {
 *     name: 'Lia',
 *   };
 * profile.set(value);
 * profile.name(); // 'Lia'
 * ```
 */
export type FormSet<TNodes extends Nodes> = {
  [K in keyof TNodes]: NodeSet<TNodes[K]>;
};

/**
 * Partial object accepted by a form's `patch()`; omitted properties remain unchanged, but supplied arrays require complete item values and reconcile like set().
 *
 * ```ts
 * const name = field('Ada');
 * const profile = form({ name });
 * const value: FormPatch<{
 *   name: typeof name;
 * }> = {
 *   name: 'Lia',
 * };
 * profile.patch(value);
 * profile.name(); // 'Lia'
 * ```
 */
export type FormPatch<TNodes extends Nodes> = {
  [K in keyof TNodes]?: NodePatch<TNodes[K]>;
};

export type NormalizedNodeWithDefault<TNode, TNullable extends boolean | undefined> =
  [TNode] extends [AnyNode] ? TNode
    : [TNode] extends [null | undefined] ? FieldNode<unknown>
      : [TNode] extends [FieldShorthand] ? FieldNode<WidenFieldShorthand<TNode> | (TNullable extends true ? null : never)>
        : [TNode] extends [ObjectNodeDefinitions] ? GroupNode<NormalizedNodesWithDefault<TNode, TNullable>>
          : FieldNode<TNode | (TNullable extends true ? null : never)>;

export type NormalizedNode<TNode> = NormalizedNodeWithDefault<TNode, undefined>;

export type NormalizedNodesWithDefault<TNodes extends ObjectNodeDefinitions, TNullable extends boolean | undefined> = {
  [K in keyof TNodes]: NormalizedNodeWithDefault<TNodes[K], TNullable>;
};

export type NormalizedNodes<TNodes extends ObjectNodeDefinitions> = {
  [K in keyof TNodes]: NormalizedNode<TNodes[K]>;
};

/** Result of attaching a node definition or shorthand dynamically to an object node. */
export type AddedNode<TDefinition, TParent extends AnyNode> =
  NodeWithParent<NormalizedNode<TDefinition>, TParent>;

/** Readonly runtime-key map of dynamic and initially declared children. */
export type DynamicFormChildren = {
  readonly [key: string]: DynamicNode | undefined;
};

export type FormRoot<TNodes extends Nodes, TParent extends AnyNode> = AnyNode extends TParent
  ? FormNode<TNodes, TParent>
  : RootNode<TParent>;

export type FormApi<TNodes extends Nodes, TParent extends AnyNode = AnyNode> = {
  /**
   * Returns the concrete primitive represented by this node.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.nodeType(); // 'form'
   * ```
   */
  nodeType(): 'form';
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
   * const node = form({ name: field('Ada') });
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
   * const node = form({ name: field('Ada') });
   * const stop = node.onValueChange(value => {
   *   console.log(value);
   * }, { debounce: 300 });
   * // Cancel pending and future delivery.
   * stop();
   * ```
   *
   * ```ts
   * const node = form({ name: field('Ada') });
   * const values: unknown[] = [];
   * const stop = node.onValueChange(value => {
   *   values.push(value);
   * }, { emitCurrent: true });
   * values.length; // 1
   * stop();
   * ```
   *
   * @param callback Receives the exposed value and original node after a committed change, and at registration when emitCurrent is true. Return values are ignored. Errors from later synchronous notifications propagate after other listeners are notified; debounced errors are thrown from the timer callback.
   * @param options Optional emitCurrent (default false) delivers the current value synchronously before returning. Optional debounce in finite, non-negative milliseconds (default zero); invalid delays throw RangeError. Optional subscription owner. Omission uses the registration context, falling back to the node's injector; an explicit injector does not change node ownership.
   */
  onValueChange(callback: (value: FormValue<TNodes>, node: FormNode<TNodes, TParent>) => void, options?: { injector?: Injector; debounce?: number; emitCurrent?: boolean }): () => void;
  /**
   * Readonly runtime child map. Declared properties retain exact node types; arbitrary keys use DynamicNode.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.children.name(); // 'Ada'
   * ```
   */
  readonly children: FormChildren<TNodes, TParent> & Readonly<Record<string, DynamicNode>>;
  /**
   * **Dynamically added nodes are excluded by default.** Pass `{ includeDynamic: true }` to visit them.
   *
   * Visits a snapshot of declared immediate children in object-entry order without recursion.
   * Empty declarations visit no children by default but give the callback a DynamicNode type.
   * Additions during iteration are deferred; removed snapshot entries are still visited.
   * Callback errors propagate and stop iteration.
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   * const keys: string[] = [];
   * profile.forEachChild((child, key) => {
   *   keys.push(key);
   * });
   * keys; // ['name']
   * ```
   *
   * @reactive Tracks child additions and removals, plus signals read by the callback.
   * @param callback Receives the child node and its string key.
   */
  forEachChild(callback: (child: keyof TNodes extends never ? DynamicNode : FormChildren<TNodes, TParent>[keyof TNodes], key: string) => void, options?: { includeDynamic?: false }): void;
  /**
   * **Dynamically added nodes are excluded unless `includeDynamic` is `true`.**
   *
   * Includes children added with `add()` when enabled. A runtime boolean uses
   * DynamicNode callbacks because added nodes may be visited. Empty declarations require true
   * to visit their added children.
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
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
   * Returns a child by runtime key, or `undefined` when no current child has that key.
   *
   * Look up children attached through either `add()` signature.
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   * profile.add('age', field(36));
   * profile.get('age')?.(); // 36
   * profile.get('missing'); // undefined
   * ```
   */
  get(key: string): DynamicNode | undefined;
  /**
   * Adds one child node at runtime and returns that live node with its exact inferred type.
   *
   * The key must not already belong to this form. Concise values are normalized to `field()` and
   * plain object definitions to `group()`. An explicitly supplied node must not have a parent.
   * Dynamic children are not installed as direct properties. Read them through `get()` or
   * the exact node returned by this method.
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   *
   * const age = profile.add('age', field(23));
   * age(); // 23
   * profile.get('age') === age; // true
   * ```
   */
  add<TKey extends string, TDefinition>(key: TKey extends keyof TNodes | '$api' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): AddedNode<TDefinition, FormNode<TNodes, TParent>>;
  /**
   * Adds several child definitions atomically and returns an exact keyed map of their attached
   * live nodes.
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   *
   * const added = profile.add({
   *   age: field(36),
   *   address: { city: field('London') },
   * });
   *
   * added.age(); // 36
   * added.address.city(); // 'London'
   * profile.get('address') === added.address;
   * // true
   * ```
   */
  add<TDefinitions extends ObjectNodeDefinitions>(definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions> & Partial<Record<keyof TNodes | '$api', never>>): {
    readonly [TKey in keyof TDefinitions]: AddedNode<TDefinitions[TKey], FormNode<TNodes, TParent>>;
  };
  /**
   * Detaches and returns a dynamically added child, or `undefined` when the key is absent.
   * Initially declared children are fixed and cannot be removed.
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   * profile.add('age', field(36));
   * const age = profile.remove('age');
   * age?.(); // 36
   * age?.parent(); // null
   * ```
   */
  remove(key: string): DynamicNode | undefined;
  /**
   * This explicit form workflow. Descendants resolve this form until another nested form begins.
   * Unlike `root()`, this signal deliberately does not cross the form's workflow boundary.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.form() === node; // true
   * ```
   */
  form: Signal<FormNode<TNodes, TParent>>;
  /**
   * Complete structural root containing this form. A root or detached form returns itself.
   * A nested form therefore returns itself from `form()` and its outermost ancestor from `root()`.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.root() === node; // true
   * ```
   */
  root: Signal<FormRoot<TNodes, TParent>>;
  /**
   * Immediate structural parent of this form, or `null` when it is a root or has been detached.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.parent(); // null
   * ```
   */
  parent: Signal<TParent | null>;
  /**
   * Property and array-index segments from the complete root to this form. Root forms use `[]`.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.path(); // []
   * ```
   */
  path: Signal<readonly string[]>;
  /**
   * Property or array index under which this form is stored, or `null` when it is a root form.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.keyInParent(); // null
   * ```
   */
  keyInParent: Signal<NodeKeyInParent<TParent>>;
  /**
   * Exposed aggregate of public child values. The `equal` option may retain a previous snapshot.
   *
   * `value.committed()` reads committed data before configured equality; `value.control()` also
   * includes this node's pending input. Their `set()` methods perform committed/control writes.
   * See {@link NodeValueSignal} for debounce, aggregate, validation, and interaction semantics.
   *
   * Prefer calling the form directly instead of using `profile.value()` for ordinary value reads:
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node(); // { name: 'Ada' }
   * ```
   */
  value: NodeValueSignal<{ [K in keyof TNodes]: NodeValue<TNodes[K]> }, FormSet<TNodes>>;
  /**
   * Returns a stable, live readonly signal of the exposed value, with no node operations.
   * Preserves configured equality and committed-value reads; pending control input remains pending.
   * This does not mark the node readonly or prevent deep mutation of object values.
   * The node and its `$api` return the same signal, and the method is safe to extract.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const value = profile.asReadonly();
   * profile.name.set('Lia');
   * value(); // { name: 'Lia' }
   * ```
   */
  asReadonly(): Signal<FormValue<TNodes>>;
  /**
   * Assigns a complete form value immediately without marking the form or its descendants dirty.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.set({ name: 'Lia' });
   * node(); // { name: 'Lia' }
   * ```
   */
  set(value: FormSet<TNodes>): void;
  /**
   * Computes and sets the complete form value from its current value without marking nodes dirty.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   *   visits: field.strict(0),
   * });
   * profile.update(value => ({
   *   ...value,
   *   visits: value.visits + 1,
   * }));
   * profile.visits(); // 1
   * ```
   */
  update(updater: (value: FormValue<TNodes>) => FormSet<TNodes>): void;
  /**
   * Assigns supplied child branches immediately; arrays reconcile complete values like set(). Omitted branches remain unchanged and unknown runtime keys are ignored.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.patch({ name: 'Lia' });
   * node(); // { name: 'Lia' }
   * ```
   */
  patch(value: FormPatch<TNodes>): void;
  /**
   * Recursively clears touched and dirty state and cancels pending control input. Passing a complete
   * value also assigns it; omitting the value preserves all current committed values.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.set({ name: 'Lia' });
   * node.markAsDirty();
   * node.reset();
   * node(); // { name: 'Lia' }
   * node.dirty(); // false
   * ```
   */
  reset(...args: [] | [value: FormSet<TNodes>]): void;
  /**
   * Restores the initial values of the current form/group subtree and resets interaction state.
   *
   * Preserves the current object schema: added fields return to their own initial values, removed
   * fields are not recreated, and existing child nodes remain attached. A field changed before it
   * was attached still restores its declaration value. Nested forms and groups follow the same
   * rules. Arrays restore their captured initial values, count and order through reconciliation.
   * Resetting one branch does not reset siblings or clear interaction flags owned by ancestors.
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
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.set({ name: 'Lia' });
   * node.resetToInitial();
   * node(); // { name: 'Ada' }
   * ```
   */
  resetToInitial(): void;
  /**
   * Current normalized validators assigned directly to this form, in declaration order.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * const rule = validator(() => null);
   * node.setValidators(rule);
   * node.validators()[0] === rule; // true
   * ```
   */
  validators: Signal<Validators<FormValue<TNodes>>> & {
    /**
     * Resolves returned synchronous compositions; async validators remain unexecuted references.
     *
     * ```ts
     * const node = form({
     *   name: field('Ada'),
     * });
     * const rule = validator(() => null);
     * node.setValidators(() => [rule]);
     * node.validators({ resolve: true })[0] ===
     *   rule; // true
     * ```
     *
     * @reactive Tracks composition dependencies and shares synchronous validation evaluation.
     */
    (options: { resolve?: boolean }): Validators<FormValue<TNodes>>;
  };
  /**
   * Replaces validators owned by this form and immediately validates its current aggregate value.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * node.invalid(); // true
   * ```
   */
  setValidators(validators: ValidatorSource<FormValue<TNodes>, FormNode<TNodes, TParent>>): void;
  /**
   * A signal containing the validation errors of **this form node itself, excluding its descendants**.
   *
   * ℹ️ To collect errors from the complete subtree, use `allErrors()` instead.
   *
   * Pass `{ descendants: true }` to read the same subtree errors as `allErrors()`.
   *
   * ```ts
   * const node = form({
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
  errors: NodeErrorsSignal<FormNode<TNodes, TParent>>;
  /**
   * A signal containing the validation errors of **this form node and its descendants**.
   *
   * ℹ️ To read only errors belonging directly to this form node, use `errors()` instead.
   *
   * Shortcut for `errors({ descendants: true })`, returning the same cached array.
   *
   * ```ts
   * const node = form({
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
   * Whether this form and every descendant have completed validation without errors.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.valid(); // true
   * ```
   */
  valid: Signal<boolean>;
  /**
   * Whether this form or any descendant currently contributes a validation error.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.invalid(); // false
   * ```
   */
  invalid: Signal<boolean>;
  /**
   * Returns the first validation error belonging directly to this form and matching `kind`.
   * Suggests registered error kinds while accepting any custom string.
   *
   * ```ts
   * const profile = form({
   *   name: field('', [required]),
   * });
   * profile.getError('required'); // undefined
   * profile.name.getError('required')?.kind;
   * // 'required'
   * ```
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationErrorWithTargetNode<FormNode<TNodes, TParent>> & ValidationErrorMap[TKind]) | undefined;
  /**
   * Returns the first custom error belonging directly to this form and matching `kind`.
   * Suggests registered error kinds while accepting any custom string.
   *
   * ```ts
   * const node = form({
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
  getError<TKind extends keyof ValidationErrorMap | (string & {})>(kind: TKind): (ValidationErrorWithTargetNode<FormNode<TNodes, TParent>> & CustomValidationError<TKind>) | undefined;
  /**
   * Whether this node's own errors contain the given kind. Does not search descendants.
   * Suggests registered error kinds while accepting any custom string.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
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
   * const node = form({
   *   name: field('Ada'),
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
   * Whether active validation metadata marks this form itself as required.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.required(); // false
   * ```
   */
  required: Signal<boolean>;
  /**
   * Whether asynchronous validation is active on this form or any descendant.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.pending(); // false
   * ```
   */
  pending: Signal<boolean>;
  /**
   * Whether `submit()` has been called on this form since its last reset.
   *
   * Becomes true synchronously before submission guards, including invalid, missing-action, and
   * concurrent attempts. This records an attempt, not success; `submitting()` separately indicates
   * a running action. Value edits and completed or rejected actions preserve this flag.
   *
   * `reset()`, `reset(value)`, and `resetToInitial()` clear it, including when an ancestor resets
   * this form. Resetting a field does not clear its owner's flag. Each explicit nested form keeps
   * its own history: submitting an ancestor or descendant does not set this form's flag.
   * A reset during an asynchronous action stays cleared when that action settles.
   *
   * ```ts
   * const profile = form({ name: field('') });
   * await profile.submit();
   * profile.submitted();
   * // true, even without an onSubmit action
   * profile.reset();
   * profile.submitted(); // false
   * ```
   */
  submitted: Signal<boolean>;
  /**
   * Whether this form or an ancestor form is currently running its submission action.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.submitting(); // false
   * ```
   */
  submitting: Signal<boolean>;
  /**
   * Marks and flushes the subtree, then runs the configured submission action when validation
   * allows it. Clears previous subtree submission errors before checking local validation.
   * Resolves to `false` for returned errors, blocked/concurrent attempts, or a missing action.
   * Errors target this form or its captured descendants; edits/reset/detachment discard stale errors.
   * Thrown or rejected action failures propagate without becoming validation errors.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * }, {
   *   onSubmit: async () => null,
   * });
   * await profile.submit(); // true
   * ```
   */
  submit(): Promise<boolean>;
  /**
   * Whether any descendant field currently has a pending control-value debounce.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.debouncing(); // false
   * ```
   */
  debouncing: Signal<boolean>;
  /**
   * Immediately commits every pending control value in this form's subtree.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada', { debounce: 'blur' }),
   * });
   * profile.name.value.control.set('Lia');
   * profile.flush();
   * profile.name(); // 'Lia'
   * ```
   */
  flush(): void;
  /**
   * Focuses the first bound UI control in this form's subtree, in DOM order.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   imports: [FormNodeDirective],
   *   template: `
   *     <input [formNode]="form.name" />
   *     <button (click)="form.focus()">
   *       Focus name
   *     </button>
   *   `,
   * })
   * export class ProfilePage {
   *   form = form({ name: field('Ada') });
   * }
   * ```
   */
  focus(options?: FocusOptions): void;
  /**
   * Aggregated validation phase for this form subtree: `'valid'`, `'invalid'`, or `'unknown'`.
   *
   * `'unknown'` means asynchronous validation is pending on this form or a descendant and no error
   * is currently available anywhere in the subtree. While unknown, `pending()` is true and both
   * `valid()` and `invalid()` are false. Any available error makes the status `'invalid'`, even if
   * other validation remains pending.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.validationStatus(); // 'valid'
   * ```
   */
  validationStatus: Signal<ValidationStatus>;
  /**
   * Whether this form or any descendant has been marked touched.
   *
   * ℹ️ Disabled, readonly, or hidden nodes report `false` and do not contribute touched state to ancestors.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.touched(); // false
   * ```
   */
  touched: Signal<boolean>;
  /**
   * Logical inverse of `touched()`.
   *
   * Whether neither this form nor any contributing descendant currently reports touched state.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.untouched(); // true
   * ```
   */
  untouched: Signal<boolean>;
  /**
   * Marks this form and, by default, every interactive descendant as touched and commits their
   * pending control values for every debounce strategy.
   *
   * This can change committed values and trigger validation and value-change callbacks,
   * even when nodes are already touched. Noninteractive subtrees ignore this operation.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.markAsTouched();
   * node.touched(); // true
   * ```
   */
  markAsTouched(options?: {
    /**
     * Skips recursively touching and committing descendants; this form still commits its own pending input.
     *
     * **Default:** `false`; visit interactive descendants too.
     *
     * ```ts
     * const profile = form({ name: field('Ada') });
     * profile.markAsTouched({
     *   skipDescendants: true,
     * });
     * profile.name.touched(); // false
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
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.markAsTouched();
   * node.markAsUntouched();
   * node.touched(); // true
   * ```
   */
  markAsUntouched(): void;
  /**
   * Whether this form currently reports user-modified state.
   *
   * This becomes `true` when the form's own state is marked dirty or an interactive descendant is
   * dirty. Programmatic value updates do not mark nodes dirty. `markAsPristine()` clears only this
   * form's own state, so a dirty descendant can keep the result `true`.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.dirty(); // false
   * ```
   */
  dirty: Signal<boolean>;
  /**
   * Logical inverse of `dirty()`.
   *
   * Whether neither this form nor any contributing descendant currently reports user-modified state.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.pristine(); // true
   * ```
   */
  pristine: Signal<boolean>;
  /**
   * Marks this form's own state dirty, making `dirty()` true and `pristine()` false while it is interactive.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.markAsDirty();
   * node.dirty(); // true
   * ```
   */
  markAsDirty(): void;
  /**
   * Clears this form's own dirty state. `pristine()` becomes true and `dirty()` false only when no
   * contributing descendant remains dirty.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.markAsDirty();
   * node.markAsPristine();
   * node.dirty(); // false
   * ```
   */
  markAsPristine(): void;
  /**
   * Whether this form is effectively disabled by its own state or an ancestor reason.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.disabled(); // false
   * ```
   */
  disabled: Signal<boolean>;
  /**
   * Active inherited and local causes of this form's disabled state.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
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
   * Whether this form has no active local or inherited disabled reason and can participate normally.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.enabled(); // true
   * ```
   */
  enabled: Signal<boolean>;
  /**
   * Disables this form subtree, optionally recording a user-facing reason.
   * Sets `disabled()` to true and `enabled()` to false on this form and its descendants.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
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
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.disable();
   * node.enable();
   * node.disabled(); // false
   * ```
   */
  enable(): void;
  /**
   * Whether this form is effectively readonly through its own state or an ancestor.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.readonly(); // false
   * ```
   */
  readonly: Signal<boolean>;
  /**
   * Logical inverse of `readonly()`.
   *
   * Whether this form accepts value changes from a control bound directly to it.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.writable(); // true
   * ```
   */
  writable: Signal<boolean>;
  /**
   * Marks this form subtree readonly, making `readonly()` true and `writable()` false throughout it.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
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
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.markAsReadonly();
   * node.markAsWritable();
   * node.readonly(); // false
   * ```
   */
  markAsWritable(): void;
  /**
   * Whether this form is effectively hidden through its own state or an ancestor.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.hidden(); // false
   * ```
   */
  hidden: Signal<boolean>;
  /**
   * Logical inverse of `hidden()`.
   *
   * Whether this form is currently intended to be shown to the user.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.visible(); // true
   * ```
   */
  visible: Signal<boolean>;
  /**
   * Hides this form subtree, making `hidden()` true and `visible()` false throughout it.
   *
   * ```ts
   * const node = form({
   *   name: field('Ada'),
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
   * const node = form({
   *   name: field('Ada'),
   * });
   * node.hide();
   * node.show();
   * node.hidden(); // false
   * ```
   */
  show(): void;
};

export type NodeWithParent<TNode extends AnyNode, TParent extends AnyNode> =
  TNode extends { $api: { nodeType(): 'field' } }
    ? TNode extends FieldNode<infer TValue, AnyNode> ? FieldNode<TValue, TParent> : TNode
    : TNode extends { $api: { nodeType(): 'form' } }
      ? TNode extends FormNode<infer TNodes, AnyNode> ? FormNode<TNodes, TParent> : TNode
      : TNode extends { $api: { nodeType(): 'group' } }
        ? TNode extends GroupNode<infer TNodes, AnyNode> ? GroupNode<TNodes, TParent> : TNode
        : TNode extends { $api: { nodeType(): 'array' } }
          ? TNode extends ArrayNode<infer TItem, AnyNode> ? ArrayNode<TItem, TParent> : TNode
          : TNode;

export type FormChildren<TNodes extends Nodes, TParent extends AnyNode> = {
  readonly [K in keyof TNodes]: NodeWithParent<TNodes[K], FormNode<TNodes, TParent>>;
};

type FormApiProperty<TNodes extends Nodes, TParent extends AnyNode> = {
  /**
   * Callable, collision-safe access to the form API.
   *
   * Calling `$api()` reads the same exposed value as the node and tracks signal dependencies.
   * Child names never replace members on this API; access children through `children` when available.
   *
   * ```ts
   * const node = form({ name: field('Ada') });
   * node.$api.valid(); // true
   * ```
   */
  $api: CallableNodeApi<FormApi<TNodes, TParent>>;
};

/**
 * Form node model. Omit the first type argument for an unspecified structure, or provide it
 * to preserve exact child types.
 *
 * **Without generic arguments, use `$api` for state and operations because child names may collide.**
 *
 * ```ts
 * const node = form({ name: field('Ada') });
 * node(); // { name: 'Ada' }
 * ```
 */
export type FormNode<TNodes extends Nodes = never, TParent extends AnyNode = AnyNode> =
  [TNodes] extends [never] ? GenericFormNode
    : NodeSignal<{ [K in keyof TNodes]: NodeValue<TNodes[K]> }>
  & {
    /**
     * Returns the form's exposed aggregate value after configured equality and participates in signal dependency tracking.
     *
     * ```ts
     * const node = form({ name: field('Ada') });
     * node(); // { name: 'Ada' }
     * ```
     */
    (): { [K in keyof TNodes]: NodeValue<TNodes[K]> };
  }
  & FormApiProperty<TNodes, TParent>
  & FormChildren<TNodes, TParent>
  & Omit<FormApi<TNodes, TParent>, keyof TNodes>
  & HiddenFunctionMembers<keyof TNodes | keyof FormApi<TNodes, TParent>>;
