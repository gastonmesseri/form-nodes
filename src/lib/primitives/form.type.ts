import type { Injector, Signal } from '@angular/core';

import type { FieldNode } from './field.type';
import type { GroupNode } from './group.type';
import type { ArrayNode } from './array.type';
import type { GenericFormNode } from '../types/generic-node.type';
import type { SyncInputName } from '../configuration/node-input-config';
import type { ValidatorMessages } from '../validation/validator-messages';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { DisabledReason, DynamicNode, AnyNode, NodeKeyInParent, NodePatch, NodeSet, Nodes, NodeValue, RootNode } from '../types/node.type';
import type { CustomValidationError, ValidationErrorMap, ValidationStatus, ValidatorSource, Validators, ValidationErrorWithTargetNode } from '../validation/validation.type';

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
   * **EXPERIMENTAL — uses Angular internals. Disabled by default.**
   *
   * Reactively copies node state and constraints into matching custom-control inputs. This is
   * one-way node-to-component synchronization; it does not enable value binding, execute
   * validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs.
   *
   * Selections:
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
   * Supported input names: disabled, disabledReasons, readonly, hidden, dirty, touched, invalid,
   * pending, errors, name, required, min, max, minLength, maxLength, and pattern. Lists use public
   * input names, including aliases. Missing inputs are ignored. Selecting disabled in a list does
   * not implicitly select disabledReasons. Derived states and validator constraints require all,
   * signal-controls, or an explicit list. Every enabled selection updates reactively, not by polling.
   * Conditional constraints and validator removal update selected inputs to their current/neutral
   * values. Selected writes may replace component defaults and explicit template bindings.
   *
   * Native DOM controls retain normal value and state synchronization. CVAs retain writeValue,
   * change/touch callbacks, and setDisabledState independently of this option. Selecting a CVA's
   * disabled input may write it in addition to calling setDisabledState. Model values and their
   * touch/focus/reset hooks remain connected in every mode. Pair controls must first be enabled
   * with bindInputOutputPairs; only target all can synchronize their optional state inputs.
   *
   * Each option resolves independently: node option (including factory defaults), nearest explicit
   * provider, global fallback, then false. Omission/undefined inherits; null/false disables. Objects
   * and lists replace inherited selections without merging. A parent node option does not configure
   * descendants; use providers or factory defaults for shared settings. Provider/global fallbacks
   * are captured on connection; changing globals does not reconfigure existing bindings. Rebinding
   * uses the replacement node's configuration. Inputs no longer selected retain their last values.
   * Treat selection objects and lists as fixed configuration, not reactive sources.
   *
   * To read state without experimental writes, combine a value/checked model with useFormNodeState()
   * and render its signals. The hook does not populate the component's input properties.
   *
   * @example Select constraints only on model controls.
   * ```ts
   * field('', {
   *   syncInputs: { inputs: ['required', 'minLength'], target: 'signal-controls' },
   * });
   * provideFormNodesConfig({ syncInputs: 'signal-controls' });
   * ```
   *
   * @experimental Optional component input writes depend on Angular internals.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#custom-control-inputs | Input synchronization and adapter selection}
   */
  syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | { inputs: 'declared' | 'all' | readonly SyncInputName[]; target?: 'all' | 'signal-controls' | 'cva' | undefined } | null | undefined;

  /**
   * **EXPERIMENTAL — uses Angular internals. Disabled by default.**
   *
   * Enables a recognized `value`/`valueChange` or `checked`/`checkedChange` input/output pair when
   * the selected control has neither a CVA nor an actual value/checked model. Supports signal
   * inputs, decorator inputs, and their public aliases. Recognition uses runtime inputs/outputs;
   * an implements declaration is not required. CVAs and real models always take precedence and
   * keep their standard connections regardless of this option.
   *
   * True enables the pair's complete connection: node-to-input value writes, output-to-node edits,
   * touch output, optional focus/reset hooks, and optional writable node reference. Changes follow
   * normal validation, dirty state, and pending/committed debounce rules; touch commits blur updates.
   * False/null keeps the pair inactive: no value or state-input writes, no change/touch processing,
   * and no calls to its focus/reset hooks. Inactive pairs remain recognizable hosts, not errors.
   * Model/CVA/native connections and validation continue normally.
   *
   * This option does not select optional state inputs. Use syncInputs separately; for example,
   * bindInputOutputPairs true with syncInputs false connects only value and interaction. Neither all nor
   * an empty syncInputs list enables a pair. Active pairs accept syncInputs selections targeting all;
   * targets signal-controls and cva exclude them.
   *
   * Node options (including factory defaults) override the nearest explicit provider, then the
   * global fallback, then false. Undefined/omission inherits independently of syncInputs; null/false
   * disables. Parent node options do not configure descendants. Provider/global defaults are captured
   * on connection. Rebinding to an inactive node pauses the pair and releases its writable node
   * reference; existing component input values remain unchanged. Returning to an active node writes
   * its current control value again even if equal to the last value written before pausing. Cleanup
   * releases subscriptions when the binding is destroyed. Use initialized value inputs, not required
   * inputs, since an inactive pair supplies no value.
   *
   * @example Enable paired value binding independently of state inputs.
   * ```ts
   * field('', { bindInputOutputPairs: true, syncInputs: false });
   * configureGlobalFormNodes({ bindInputOutputPairs: true });
   * ```
   *
   * @experimental Pair input writes depend on Angular internals.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#bind-input-output-pairs | Paired control configuration}
   */
  bindInputOutputPairs?: boolean | null | undefined;
  /**
   * Equality for the exposed aggregate value. Defaults to `Object.is`.
   * Equal results retain the previous public value for callable/value reads, value-dependent
   * validation, submission values, and update callbacks. Child writes and internal control
   * synchronization still use the latest committed values. The comparator is captured at
   * construction and runs untracked when the exposed computed value is evaluated.
   *
   * @example
   * ```ts
   * form({
   *   name: field('Marco'),
   *   age: field(18),
   * }, { equal: 'deep' });
   * 
   * // or
   * 
   * form({
   *   name: field('Marco')
   * }, {
   *   equal: (previous, next) => {
   *     return previous.name.toLowerCase() === next.name.toLowerCase();
   *   }
   * });
   * 
   * ```
   */
  equal?: 'shallow' | 'deep' | ((previous: TValue, next: TValue) => boolean);

  /**
   * One validator or an array of validators that validate the complete form value.
   *
   * Start with a named validator when the rule is reused:
   *
   * @example
   * ```ts
   * form({
   *   email: field(''),
   *   marketingConsent: field(false),
   * }, {
   *   validators: [profilePolicy],
   * });
   * ```
   *
   * A small form-specific rule can be declared inline:
   *
   * @example
   * ```ts
   * form({
   *   acceptTerms: field(false),
   * }, {
   *   validators: ({ value }) => {
   *     return value().acceptTerms
   *       ? null
   *       : { kind: 'termsRequired', message: 'Accept the terms to continue.' };
   *   },
   * });
   * ```
   *
   * Form validators are also useful for cross-field rules:
   *
   * @example
   * ```ts
   * form({
   *   password: field(''),
   *   confirmation: field(''),
   * }, {
   *   validators: [
   *     ({ value }) => {
   *       return value().password === value().confirmation
   *         ? null
   *         : { kind: 'passwordMismatch', message: 'Passwords must match.' };
   *     },
   *   ],
   * });
   * ```
   *
   * Asynchronous rules must be wrapped with `asyncValidator()`:
   *
   * @example
   * ```ts
   * form({
   *   username: field(''),
   * }, {
   *   validators: asyncValidator(async ({ value }) => {
   *     const available = await isAccountAvailable(value());
   *     return available ? null : { kind: 'accountUnavailable' };
   *   }),
   * });
   * ```
   *
   * Use an array when the form needs multiple validators. Arrays may contain synchronous
   * validators, validators created with `asyncValidator()`, and ignored `null` or `undefined`
   * entries.
   */
  validators?: ValidatorSource<TValue, TForm>;
  /** Optional injector that owns the asynchronous validation watcher lifecycle. */
  injector?: Injector;
  /**
   * Whether this node may use the injector of its parent or another ancestor when it has no
   * injector of its own. Defaults to `true`. Set to `false` to create an injector-inheritance
   * boundary while preserving an explicit or currently captured injector on this node.
   */
  inheritInjector?: boolean;
  /**
   * Whether this node may temporarily adopt the injector of a directly bound `[formNode]` host
   * when it has no injector of its own. Defaults to `true`. The binding injector takes precedence
   * over an inherited ancestor injector and is released when the binding is destroyed or rebound.
   */
  adoptBindingInjector?: boolean;
  /**
   * Partial validator message catalog inherited by this form or array and its descendants.
   *
   * ℹ️ This scope overrides provider and global catalogs. A validator's own `message` option has
   * higher priority. Returning `undefined` from the catalog source or a message function continues
   * through the fallback chain.
   *
   * @reactive Tracks signals read by the catalog source and the selected message function while a
   * built-in validator is failing.
   */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined);
  /**
   * Default control-value debounce inherited by descendants: milliseconds, `'blur'`, or a
   * cancelable asynchronous function.
   *
   * @example Give descendant controls a 300-millisecond debounce by default.
   * ```ts
   * form({
   *   searchTerm: field(''),
   * }, { debounce: 300 });
   * ```
   *
   * @example Commit descendant control values when their controls lose focus.
   * ```ts
   * form({
   *   displayName: field(''),
   * }, { debounce: 'blur' });
   * ```
   */
  debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);
  /**
   * Initial or reactive visibility of the complete form subtree.
   *
   * @example Create a form that starts hidden.
   * ```ts
   * form({
   *   internalNotes: field(''),
   * }, { hidden: true });
   * ```
   *
   * @example Hide a business-details workflow for personal accounts.
   * ```ts
   * form({
   *   companyName: field(''),
   * }, {
   *   hidden: () => accountType() !== 'business',
   * });
   * ```
   */
  hidden?: boolean | (() => boolean);
  /**
   * Initial or reactive disabled state for the complete subtree. Return a string to record a
   * user-facing reason.
   *
   * @example Create a form that starts disabled.
   * ```ts
   * form({
   *   email: field(''),
   * }, { disabled: 'This workflow is not available yet.' });
   * ```
   *
   * @example Disable a checkout workflow while its order is being submitted.
   * ```ts
   * form({
   *   email: field(''),
   * }, {
   *   disabled: () => submittingOrder() ? 'The order is being submitted.' : false,
   * });
   * ```
   */
  disabled?: boolean | string | (() => boolean | string);
  /**
   * Initial or reactive readonly state for the complete subtree.
   *
   * @example Create a form that starts in readonly mode.
   * ```ts
   * form({
   *   displayName: field(''),
   * }, { readonly: true });
   * ```
   *
   * @example Present an archived record without allowing edits.
   * ```ts
   * form({
   *   displayName: field(''),
   * }, {
   *   readonly: () => recordStatus() === 'archived',
   * });
   * ```
   */
  readonly?: boolean | (() => boolean);
  /** Runs when submitWhen permits submission. Receives the exposed value snapshot first and this form second. */
  onSubmit?(value: TValue, form: TForm): void | PromiseLike<void>;
  /** Runs when validation blocks submission, including pending validation with submitWhen: 'valid'. Does not run for concurrent submissions or a missing onSubmit. */
  onSubmitBlocked?(form: TForm): void;
  /** When validation permits submission: 'not-invalid' (default) allows pending validation, 'valid' requires valid(), and 'always' bypasses the validation gate without disabling validators. Pending validation blocks immediately; it is not awaited. */
  submitWhen?: 'valid' | 'not-invalid' | 'always';
};

/** Object value produced by a form, with each child node mapped to its readable value. */
export type FormValue<TNodes extends Nodes> = {
  [K in keyof TNodes]: NodeValue<TNodes[K]>;
};

/**
 * Structural contract for checking a form or group against an aggregate value type without
 * replacing its inferred child-node types.
 *
 * @example Validate a named model while preserving an `ArrayNode` child.
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

/** Complete object accepted by a form's `set()`, recursively using each child's set type. */
export type FormSet<TNodes extends Nodes> = {
  [K in keyof TNodes]: NodeSet<TNodes[K]>;
};

/** Partial object accepted by a form's `patch()`; omitted child properties remain unchanged. */
export type FormPatch<TNodes extends Nodes> = {
  [K in keyof TNodes]?: NodePatch<TNodes[K]>;
};

export type NormalizedNodeWithDefault<TNode, TNullable extends boolean> =
  [TNode] extends [AnyNode] ? TNode
    : [TNode] extends [null | undefined] ? FieldNode<unknown>
      : [TNode] extends [FieldShorthand] ? FieldNode<WidenFieldShorthand<TNode> | (TNullable extends true ? null : never)>
        : [TNode] extends [ObjectNodeDefinitions] ? GroupNode<NormalizedNodesWithDefault<TNode, TNullable>>
          : FieldNode<TNode | (TNullable extends true ? null : never)>;

export type NormalizedNode<TNode> = NormalizedNodeWithDefault<TNode, true>;

export type NormalizedNodesWithDefault<TNodes extends ObjectNodeDefinitions, TNullable extends boolean> = {
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
  /** Returns the concrete primitive represented by this node. */
  nodeType(): 'form';
  /** Readonly runtime child map. Declared properties retain exact node types; arbitrary keys use DynamicNode. */
  readonly children: FormChildren<TNodes, TParent> & Readonly<Record<string, DynamicNode>>;
  /**
   * **Dynamically added nodes are excluded by default.** Pass `{ includeDynamic: true }` to visit them.
   *
   * Visits a snapshot of declared immediate children in object-entry order without recursion.
   * Empty declarations visit no children by default but give the callback a DynamicNode type.
   * Additions during iteration are deferred; removed snapshot entries are still visited.
   * Callback errors propagate and stop iteration.
   *
   * @example Visit each immediate child.
   * ```ts
   * const profile = form({ name: field('Marco'), age: field(30) });
   * profile.forEachChild((child, key) => console.log(key, child()));
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
   * @reactive Tracks structure changes and reactive reads performed by the callback.
   */
  forEachChild(callback: (child: DynamicNode, key: string) => void, options: { includeDynamic?: boolean }): void;
  /**
   * Returns a child by runtime key, or `undefined` when no current child has that key.
   *
   * @example Look up children attached through either `add()` signature.
   * ```ts
   * const profile = form({ name: field('Ada') });
   *
   * profile.add('age', field(36));
   * profile.get('age')?.value(); // 36
   *
   * profile.add({
   *   nickname: field('countess'),
   *   address: { city: field('London') },
   * });
   * profile.get('nickname')?.value(); // 'countess'
   * profile.get('address')?.value(); // { city: 'London' }
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
   * @example Add one named child and retain its exact node type.
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
   * @example Add several children in one structural update.
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
   * profile.get('address') === added.address; // true
   * ```
   */
  add<TDefinitions extends ObjectNodeDefinitions>(definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions> & Partial<Record<keyof TNodes | '$api', never>>): {
    readonly [TKey in keyof TDefinitions]: AddedNode<TDefinitions[TKey], FormNode<TNodes, TParent>>;
  };
  /**
   * Detaches and returns a dynamically added child, or `undefined` when the key is absent.
   * Initially declared children are fixed and cannot be removed.
   */
  remove(key: string): DynamicNode | undefined;
  /**
   * This explicit form workflow. Descendants resolve this form until another nested form begins.
   * Unlike `root()`, this signal deliberately does not cross the form's workflow boundary.
   */
  form: Signal<FormNode<TNodes, TParent>>;
  /**
   * Complete structural root containing this form. A root or detached form returns itself.
   * A nested form therefore returns itself from `form()` and its outermost ancestor from `root()`.
   */
  root: Signal<FormRoot<TNodes, TParent>>;
  /** Immediate structural parent of this form, or `null` when it is a root or has been detached. */
  parent: Signal<TParent | null>;
  /**
   * Property and array-index segments from the complete root to this form. Root forms use `[]`.
   *
   * @example
   * ```ts
   * myForm.address.path();
   * // ['address']
   * ```
   */
  path: Signal<readonly string[]>;
  /**
   * Property or array index under which this form is stored, or `null` when it is a root form.
   *
   * @example
   * ```ts
   * myForm.address.keyInParent(); // 'address'
   * ```
   */
  keyInParent: Signal<NodeKeyInParent<TParent>>;
  /**
   * Exposed aggregate of public child values. The `equal` option may retain a previous snapshot.
   *
   * Prefer calling the form directly instead of using `profile.value()` for ordinary value reads:
   *
   * @example
   * ```ts
   * const profile = form({ name: field('Marco') });
   *
   * profile(); // { name: 'Marco' }
   * ```
   */
  value: Signal<{ [K in keyof TNodes]: NodeValue<TNodes[K]> }>;
  /** Current control-facing value, independent of exposed equality. Pending descendant control values are not aggregated. */
  controlValue: Signal<{ [K in keyof TNodes]: NodeValue<TNodes[K]> }>;
  /**
   * Assigns a complete form value immediately without marking the form or its descendants dirty.
   *
   * @example
   * ```ts
   * profile.set({
   *   name: 'Lia',
   *   age: 28,
   * });
   * ```
   */
  set(value: FormSet<TNodes>): void;
  /**
   * Computes and sets the complete form value from its current value without marking nodes dirty.
   *
   * @example
   * ```ts
   * profile.update(value => ({
   *   ...value,
   *   name: 'Lia',
   * }));
   * ```
   */
  update(updater: (value: FormValue<TNodes>) => FormSet<TNodes>): void;
  /** Assigns the supplied subset of child values immediately and ignores unknown runtime keys. */
  patch(value: FormPatch<TNodes>): void;
  /**
   * Recursively clears touched and dirty state and cancels pending control input. Passing a complete
   * value also assigns it; omitting the value preserves all current committed values.
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
   * @example
   * ```ts
   * const profile = form({
   *   name: field('Marco'),
   *   address: { city: field('Zurich') },
   * });
   * profile.reset({ name: 'Server value', address: { city: 'Madrid' } });
   * profile.resetToInitial();
   * profile(); // { name: 'Marco', address: { city: 'Zurich' } }
   * ```
   */
  resetToInitial(): void;
  /** Current normalized validators assigned directly to this form, in declaration order. */
  validators: Signal<Validators<FormValue<TNodes>>> & {
    /**
     * Resolves returned synchronous compositions; async validators remain unexecuted references.
     * @reactive Tracks composition dependencies and shares synchronous validation evaluation.
     */
    (options: { resolve?: boolean }): Validators<FormValue<TNodes>>;
  };
  /** Replaces validators owned by this form and immediately validates its current aggregate value. */
  setValidators(validators: ValidatorSource<FormValue<TNodes>, FormNode<TNodes, TParent>>): void;
  /**
  * A signal containing the validation errors of **this form node itself, excluding its descendants**.
  *
  * ℹ️ To collect errors from the complete subtree, use `allErrors()` instead.
   *
   * @example
   * ```ts
   * profile.errors();
   * // [{ kind: 'profileLocked', message: 'This profile cannot be edited.', targetNode: profile }]
   * ```
  */
  errors: Signal<readonly ValidationErrorWithTargetNode<FormNode<TNodes, TParent>>[]>;
  /**
  * A signal containing the validation errors of **this form node and its descendants**.
  *
  * ℹ️ To read only errors belonging directly to this form node, use `errors()` instead.
   *
   * @example
   * ```ts
   * profile.allErrors();
   * // [{ kind: 'required', message: 'Name is required.', targetNode: profile.name }]
   * ```
  */
  allErrors: Signal<readonly ValidationErrorWithTargetNode<AnyNode>[]>;
  /** Whether this form and every descendant have completed validation without errors. */
  valid: Signal<boolean>;
  /** Whether this form or any descendant currently contributes a validation error. */
  invalid: Signal<boolean>;
  /**
   * Returns the first validation error belonging directly to this form and matching `kind`.
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationErrorWithTargetNode<FormNode<TNodes, TParent>> & ValidationErrorMap[TKind]) | undefined;
  /**
   * Returns the first custom error belonging directly to this form and matching `kind`.
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends string>(kind: TKind): (ValidationErrorWithTargetNode<FormNode<TNodes, TParent>> & CustomValidationError<TKind>) | undefined;
  /**
   * Whether this node's own errors contain the given kind. Does not search descendants.
   * @reactive Memoizes by kind and tracks the node's current errors.
   */
  hasError(kind: string): boolean;
  /**
   * Whether the same validator function is directly registered on this node, including async validators.
   * By default, does not run validators. Set resolve to true to inspect resolved leaf references.
   * @reactive Memoizes by function identity and resolution mode; resolved queries track composition dependencies.
   */
  hasValidator(validator: (context: any) => unknown, options?: { resolve?: boolean }): boolean;
  /** Whether active validation metadata marks this form itself as required. */
  required: Signal<boolean>;
  /** Whether asynchronous validation is active on this form or any descendant. */
  pending: Signal<boolean>;
  /** Whether this form or an ancestor form is currently running its submission action. */
  submitting: Signal<boolean>;
  /**
   * Marks and flushes the subtree, then runs the configured submission action when validation
   * allows it. Resolves to `false` without throwing when no action is configured.
   */
  submit(): Promise<boolean>;
  /** Whether any descendant field currently has a pending control-value debounce. */
  debouncing: Signal<boolean>;
  /** Immediately commits every pending control value in this form's subtree. */
  flush(): void;
  /** Focuses the first bound UI control in this form's subtree, in DOM order. */
  focus(options?: FocusOptions): void;
  /**
   * Aggregated validation phase for this form subtree: `'valid'`, `'invalid'`, or `'unknown'`.
   *
   * `'unknown'` means asynchronous validation is pending on this form or a descendant and no error
   * is currently available anywhere in the subtree. While unknown, `pending()` is true and both
   * `valid()` and `invalid()` are false. Any available error makes the status `'invalid'`, even if
   * other validation remains pending.
   */
  validationStatus: Signal<ValidationStatus>;
  /**
   * Whether this form or any descendant has been marked touched.
   *
   * ℹ️ Disabled, readonly, or hidden nodes report `false` and do not contribute touched state to ancestors.
   */
  touched: Signal<boolean>;
  /**
   * Logical inverse of `touched()`.
   *
   * Whether neither this form nor any contributing descendant currently reports touched state.
   */
  untouched: Signal<boolean>;
  /**
   * Marks this form and, by default, every descendant as touched, making their effective
   * `touched()` true and `untouched()` false while they are interactive.
   */
  markAsTouched(options?: {
    /** When true, marks only this form and leaves every descendant untouched. */
    skipDescendants?: boolean;
  }): void;
  /** Recursively clears touched state, making `touched()` false and `untouched()` true throughout the subtree. */
  markAsUntouched(): void;
  /**
   * Whether this form currently reports user-modified state.
   *
   * This becomes `true` when the form's own state is marked dirty or an interactive descendant is
   * dirty. Programmatic value updates do not mark nodes dirty. `markAsPristine()` clears only this
   * form's own state, so a dirty descendant can keep the result `true`.
   */
  dirty: Signal<boolean>;
  /**
   * Logical inverse of `dirty()`.
   *
   * Whether neither this form nor any contributing descendant currently reports user-modified state.
   */
  pristine: Signal<boolean>;
  /** Marks this form's own state dirty, making `dirty()` true and `pristine()` false while it is interactive. */
  markAsDirty(): void;
  /**
   * Clears this form's own dirty state. `pristine()` becomes true and `dirty()` false only when no
   * contributing descendant remains dirty.
   */
  markAsPristine(): void;
  /** Whether this form is effectively disabled by its own state or an ancestor reason. */
  disabled: Signal<boolean>;
  /**
   * Active inherited and local causes of this form's disabled state.
   *
   * @example
   * ```ts
   * profile.disabledReasons();
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
   * Whether this form has no active local or inherited disabled reason and can participate normally.
   */
  enabled: Signal<boolean>;
  /**
   * Disables this form subtree, optionally recording a user-facing reason.
   * Sets `disabled()` to true and `enabled()` to false on this form and its descendants.
   *
   * @example Disable without a reason
   * ```ts
   * profile.disable();
   * ```
   *
   * @example Disable with a reason
   * ```ts
   * profile.disable('Locked');
   * ```
   */
  disable(message?: string): void;
  /**
   * Clears the imperative disabled state created by `disable()`. `enabled()` becomes true only on
   * nodes without another configured or inherited disabled reason.
   */
  enable(): void;
  /** Whether this form is effectively readonly through its own state or an ancestor. */
  readonly: Signal<boolean>;
  /**
   * Logical inverse of `readonly()`.
   *
   * Whether this form accepts value changes from a control bound directly to it.
   */
  writable: Signal<boolean>;
  /** Marks this form subtree readonly, making `readonly()` true and `writable()` false throughout it. */
  markAsReadonly(): void;
  /**
   * Clears this form's imperative readonly state. `writable()` becomes true only on nodes without
   * another configured or inherited readonly state.
   */
  markAsWritable(): void;
  /** Whether this form is effectively hidden through its own state or an ancestor. */
  hidden: Signal<boolean>;
  /**
   * Logical inverse of `hidden()`.
   *
   * Whether this form is currently intended to be shown to the user.
   */
  visible: Signal<boolean>;
  /** Hides this form subtree, making `hidden()` true and `visible()` false throughout it. */
  hide(): void;
  /**
   * Clears this form's imperative hidden state. `visible()` becomes true only on nodes without
   * another configured or inherited hidden state.
   */
  show(): void;
};

export type NodeWithParent<TNode extends AnyNode, TParent extends AnyNode> =
  TNode extends FieldNode<infer TValue, AnyNode> ? FieldNode<TValue, TParent>
    : TNode extends FormNode<infer TNodes, AnyNode> ? FormNode<TNodes, TParent>
      : TNode extends GroupNode<infer TNodes, AnyNode> ? GroupNode<TNodes, TParent>
        : TNode extends ArrayNode<infer TItem, AnyNode> ? ArrayNode<TItem, TParent> : TNode;

export type FormChildren<TNodes extends Nodes, TParent extends AnyNode> = {
  readonly [K in keyof TNodes]: NodeWithParent<TNodes[K], FormNode<TNodes, TParent>>;
};

type FormApiProperty<TNodes extends Nodes, TParent extends AnyNode> = {
  /**
   * Complete form API and the recommended access path for application code.
   *
   * When a form declares a child named `api`, this property is that child instead. Use `$api`
   * when collision-safe access to the form API is required.
   */
  api: TNodes extends { api: infer TApi extends AnyNode }
    ? NodeWithParent<TApi, FormNode<TNodes, TParent>>
    : FormApi<TNodes, TParent>;
  /**
   * Collision-safe access to the form API.
   *
   * Prefer `api` for normal application code. Use `$api` when this form declares a child named
   * `api`; the child takes precedence at `form.api`, while `form.$api` always remains the API.
   *
   * Prefer `api` for ordinary application code; `$api` remains a supported, stable escape hatch.
   */
  $api: FormApi<TNodes, TParent>;
};

/**
 * Form node model. Omit the first type argument for an unspecified structure, or provide it
 * to preserve exact child types.
 *
 * **Without generic arguments, use `$api` for state and operations because child names may collide.**
 */
export type FormNode<TNodes extends Nodes = never, TParent extends AnyNode = AnyNode> =
  [TNodes] extends [never] ? GenericFormNode
    : Signal<{ [K in keyof TNodes]: NodeValue<TNodes[K]> }>
  & {
    /** Returns the form's current aggregate committed value and participates in signal dependency tracking. */
    (): { [K in keyof TNodes]: NodeValue<TNodes[K]> };
  }
  & FormApiProperty<TNodes, TParent>
  & Omit<FormChildren<TNodes, TParent>, 'api'>
  & Omit<FormApi<TNodes, TParent>, keyof TNodes>
  & HiddenFunctionMembers<keyof TNodes | keyof FormApi<TNodes, TParent>>;
