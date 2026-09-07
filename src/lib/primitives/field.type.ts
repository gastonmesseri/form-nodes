import type { Injector, Signal } from '@angular/core';

import type { SyncInputName } from '../configuration/node-input-config';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { DisabledReason, NavigationRoot, NearestForm, Node, NodeKeyInParent, RootNode } from '../types/node.type';
import type { CustomValidationError, ValidationError, ValidationErrorMap, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';

export type FieldOptions<TValue = any> = {
  /**
   * **EXPERIMENTAL — uses Angular internals. Disabled by default.**
   *
   * Controls one-way, reactive synchronization from a bound Form Nodes node into matching
   * optional state and constraint inputs on its custom-control component. The library default
   * is disabled. It also gates experimental value binding for separate input/output pairs. This applies to the input contract used by Angular's `FormValueControl` and
   * `FormCheckboxControl`, and additional matching inputs on CVA components.
   *
   * Modes and selections:
   * - `false` or `null`: disable optional input writes and paired value transport, even if inherited settings enable them.
   * - `true` or `'only-declared'`: synchronize inputs selected by the node's initial declarations.
   * - `'only-signal-controls'`: synchronize all supported inputs only when the selected adapter
   *   connects a `value` or `checked` model. Includes validator constraints. CVAs (even with a
   *   model) receive no optional input writes; separate input/output pairs stay disconnected.
   *   Detection uses the runtime model shape, not an `implements` declaration.
   * - `'always'`: synchronize every supported input exposed by the component, whether or not its
   *   state or constraint was declared initially. This means reactive synchronization, not polling.
   * - `['disabled', 'dirty']`: always synchronize exactly those inputs; equivalent to
   *   `{ mode: 'always', inputs: ['disabled', 'dirty'] }`.
   * - `{ mode: 'only-declared', inputs: [...] }`: synchronize only inputs that are both in the
   *   list and selected by the initial node declarations.
   * - `[]`, or an object with `inputs: []`: synchronize no optional state inputs, but enable paired value transport.
   *
   * In only-declared mode, initial `disabled`, `readonly`, and `hidden` options select their
   * matching inputs. Explicit false values count as declarations. Initial `disabled` also
   * selects `disabledReasons`, but an explicit input list still filters each name independently:
   * `['disabled']` never implicitly includes `disabledReasons`.
   *
   * Validators never select inputs in only-declared mode, including initially registered
   * built-in validators. To synchronize `required`, `min`, `max`, `minLength`, `maxLength`, or
   * `pattern`, use always mode or an explicit input list such as `['required', 'minLength']`.
   * With those selections, reactive constraints and conditional validators keep updating;
   * removing a constraint updates its input to the neutral value. Node validation runs normally
   * regardless of whether constraint inputs are synchronized.
   *
   * Supported public input names are `disabled`, `disabledReasons`, `dirty`, `errors`, `hidden`,
   * `invalid`, `max`, `maxLength`, `min`, `minLength`, `name`, `pattern`, `pending`, `readonly`,
   * `required`, and `touched`. Derived states such as dirty, touched, invalid, pending, errors,
   * and generated name require always mode or an input list. Use the public input name rather
   * than an aliased component property name. Missing component inputs are ignored; existing
   * input aliases, transforms, and Angular input lifecycle notifications are preserved.
   *
   * Selected inputs receive current node state, including false, empty, and undefined values.
   * Writes can replace component defaults and explicit template bindings. Unselected inputs
   * remain component-owned. Rebinding resolves the replacement node's selection; inputs no
   * longer selected retain their last value rather than restoring an earlier component default.
   * Treat configuration objects and arrays as fixed declarations, not reactive selection sources.
   *
   * Resolution is the node's own option (including factory defaults), then its binding's nearest
   * explicit provider, then global configuration, then false. Explicit selections replace rather
   * than merge with inherited selections. Provider/global fallback is captured when the control
   * connects; changing global configuration does not reconfigure an existing connection.
   *
   * On this node, omission or explicit `undefined` uses a configured factory default, if any,
   * otherwise the provider/global fallback. This option affects only this node's direct binding;
   * it does not configure descendants. Use a provider or shared factories to configure many nodes.
   *
   * This option changes component input writes, not node state, validation, or propagation.
   * `value = model()` and `checked = model()` remain connected through public model APIs in every
   * mode; they cannot be selected here. The optional node model, touch/focus/reset hooks, native
   * control binding, and CVA `setDisabledState()` keep working for the standard model/CVA paths.
   * Separate `value`/`valueChange` and `checked`/`checkedChange` pairs connect only when the effective
   * setting is enabled, except for `'only-signal-controls'` (lists and mode/inputs objects, including
   * empty lists, enable pairs). Their value
   * writes use Angular internals. Lists filter optional state inputs, not this value channel.
   * False/null pause pair writes and ignore its change/touch outputs. Rebinding to an enabled node
   * resynchronizes its current control value. Use initial input values rather than required inputs.
   * To access full supported control state without experimental
   * input writes, combine a value/checked model with `useFormNodeState()` and apply its signals
   * to the component's view; the hook does not populate the component's own input properties.
   *
   * @example Synchronize declared inputs or explicitly select derived state.
   * ```ts
   * // Select disabled and disabledReasons, even though the initial value is false.
   * field('', { disabled: false, syncInputs: true });
   * // Always synchronize only these two inputs, without initial declarations.
   * field('', { syncInputs: ['disabled', 'dirty'] });
   * // Explicitly choose the mode; only disabled is initially declared.
   * field('', {
   *   disabled: false,
   *   syncInputs: { mode: 'only-declared', inputs: ['disabled', 'dirty'] },
   * });
   * ```
   *
   * @experimental Uses Angular internals for optional input writes; disabled by default.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#custom-control-inputs | Full syncInputs reference}
   * @see {@link https://gastonmesseri.github.io/form-nodes/guides/custom-controls#create-a-signal-model-control | Value models and useFormNodeState without experimental input writes}
   */
  syncInputs?: boolean | 'only-declared' | 'always' | 'only-signal-controls' | readonly SyncInputName[] | { mode: 'only-declared' | 'always'; inputs: readonly SyncInputName[] } | null | undefined;
  /**
   * Equality for the exposed value. Defaults to `Object.is`. Equivalent values retain the previous
   * public value for consumers and validators while internal storage and controls accept new writes.
   * The comparator is captured at construction and runs untracked when the exposed computed is
   * evaluated. Its first evaluation does not compare; comparator errors affect exposed reads.
   *
   * @example Compare structured values by content.
   * ```ts
   * field({ name: 'Marco' }, { equal: 'deep' });
   * ```
   */
  equal?: 'deep' | 'shallow' | ((previous: TValue, next: TValue) => boolean);
  /**
   * One validator or an array of validators for this field's value.
   *
   * @example Start with one built-in validator.
   * ```ts
   * field('', { validators: required });
   * ```
   *
   * @example Combine built-in validators in an array.
   * ```ts
   * field('', { validators: [required, minLength(3)] });
   * ```
   *
   * @example Configure a validator or declare a small custom rule inline.
   * ```ts
   * field('', {
   *   validators: [
   *     required('Enter a username.'),
   *     ({ value }) => value()?.includes(' ')
   *       ? { kind: 'spaces', message: 'Spaces are not allowed.' }
   *       : null,
   *   ],
   * });
   * ```
   *
   * @example Configure a validator or declare a small custom rule inline.
   * ```ts
   * field('', {
   *   validators: ({ value }) => {
   *     return someReactiveCondition() ? [required] : null;
   *   },
   * });
   * ```
   *
   * @example Add one asynchronous validator.
   * ```ts
   * field('', {
   *   validators: asyncValidator(async ({ value }) => {
   *     const available = await isUsernameAvailable(value());
   *     return available ? null : { kind: 'usernameTaken' };
   *   }),
   * });
   * ```
   *
   * Arrays may also contain validators created with `asyncValidator()` and ignored `null` or
   * `undefined` entries.
   */
  validators?: ValidatorSource<TValue, Field<TValue>>;
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
   * Delay strategy for control updates. A number waits in milliseconds, `'blur'` waits for focus
   * loss, and a function commits when its returned promise resolves. Overrides an inherited
   * debounce.
   *
   * @example Wait 300 milliseconds after the latest control change.
   * ```ts
   * field('', { debounce: 300 });
   * ```
   *
   * @example Commit the control value when the control loses focus.
   * ```ts
   * field('', { debounce: 'blur' });
   * ```
   */
  debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);
  /**
   * Initial or reactive visibility of this field.
   *
   * @example Start with the field hidden.
   * ```ts
   * field('', { hidden: true });
   * ```
   *
   * @example Hide a company field unless the user selects a business account.
   * ```ts
   * field('', {
   *   hidden: () => accountType() !== 'business',
   * });
   * ```
   */
  hidden?: boolean | (() => boolean);
  /**
   * Initial or reactive disabled state. Return a string to disable the field and expose the reason
   * through `disabledReasons()`.
   *
   * @example Start with the field disabled and record why.
   * ```ts
   * field('', { disabled: 'Only administrators can edit this field.' });
   * ```
   *
   * @example Prevent editing while a record is being saved.
   * ```ts
   * field('', {
   *   disabled: () => isSaving() ? 'The profile is being saved.' : false,
   * });
   * ```
   */
  disabled?: boolean | string | (() => boolean | string);
  /**
   * Initial or reactive readonly state.
   *
   * @example Start with a field in readonly mode.
   * ```ts
   * field('INV-2026-001', { readonly: true });
   * ```
   *
   * @example Keep an identifier visible but immutable after creation.
   * ```ts
   * field('', {
   *   readonly: () => recordAlreadyExists(),
   * });
   * ```
   */
  readonly?: boolean | (() => boolean);
};

export type FieldApi<TValue, TParent extends Node = Node> = {
  /** Returns the concrete primitive represented by this node. */
  nodeType(): 'field';
  /**
   * Nearest explicit `form()` containing this field, or `null` when no form workflow owns it.
   * A nested explicit form is the workflow owner instead of the complete structural root.
   */
  form: Signal<NearestForm<TParent> | null>;
  /**
   * Complete structural root containing this field. A standalone or detached field returns itself.
   * Use this signal when traversal must cross nested form workflow boundaries.
   */
  root: Signal<Node extends TParent ? NavigationRoot : RootNode<TParent>>;
  /** Immediate structural parent of this field, or `null` when it is a root or has been detached. */
  parent: Signal<TParent | null>;
  /**
   * Property and array-index segments from the complete root to this field. Root fields use `[]`.
   *
   * @example
   * ```ts
   * myForm.address.city.path();
   * // ['address', 'city']
   * ```
   */
  path: Signal<readonly string[]>;
  /**
   * Property or array index under which this field is stored, or `null` when it is a root field.
   *
   * @example
   * ```ts
   * myForm.age.keyInParent(); // 'age'
   * ```
   */
  keyInParent: Signal<NodeKeyInParent<TParent>>;
  /**
   * Exposed field value. The `equal` option may retain an earlier equivalent value independently
   * of the latest committed write used by controls and reset.
   *
   * Prefer calling the field directly instead of using `name.value()` for ordinary value reads:
   *
   * @example
   * ```ts
   * const name = field('Marco');
   *
   * name(); // 'Marco'
   * ```
   */
  value: Signal<TValue>;
  /**
   * Immediate value buffered from the bound UI control before any configured debounce completes.
   * Keeps the latest control input even when `equal` retains a different exposed value.
   * Most consumers should read value() instead; controlValue() is primarily intended for control bindings.
   */
  controlValue: Signal<TValue>;
  /**
   * Assigns a committed value immediately without marking the field dirty.
   *
   * @example
   * ```ts
   * name.set('Lia');
   * ```
   */
  set(value: TValue): void;
  /**
   * Computes and sets a complete value from the current exposed value without marking the field dirty.
   *
   * @example
   * ```ts
   * count.update(value => value + 1);
   * ```
   */
  update(updater: (value: TValue) => TValue): void;
  /**
   * Receives a value from a bound UI control, marks the field dirty, and applies its configured
   * debounce before committing the value.
   */
  setControlValue(value: TValue): void;
  /**
   * Whether a control-originated value is waiting to be committed by this field's numeric,
   * blur-based, or asynchronous debounce. Programmatic writes do not activate this signal.
   */
  debouncing: Signal<boolean>;
  /** Immediately commits the pending controlValue(), ending its configured debounce. Has no observable effect when no control update is pending. */
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
   */
  focus(options?: FocusOptions): void;
  /** Assigns a committed value like `set()`. Provided for a uniform node API. */
  patch(value: TValue): void;
  /**
   * Clears touched and dirty state and cancels pending control input. Passing a value also replaces
   * internally committed value; omitting it preserves that value even when `equal` retains an older
   * exposed value. Controls reset to the internally committed value.
   */
  reset(...args: [] | [value: TValue]): void;
  /** Current normalized validators assigned directly to this field, in declaration order. */
  validators: Signal<Validators<TValue>> & {
    /**
     * Resolves returned synchronous compositions; async validators remain unexecuted references.
     * @reactive Tracks composition dependencies and shares synchronous validation evaluation.
     */
    (options: { resolve?: boolean }): Validators<TValue>;
  };
  /** Replaces this field's validators and immediately validates the current exposed value. */
  setValidators(validators: ValidatorSource<TValue, Field<TValue>>): void;
  /**
  * A signal containing the validation errors of **this field itself**.
  *
  * ℹ️ To work consistently with aggregate nodes, use `allErrors()` instead.
   *
   * @example
   * ```ts
   * name.errors();
   * // [{ kind: 'required', message: 'Name is required.', targetNode: name }]
   * ```
  */
  errors: Signal<readonly ValidationError.WithTargetNode<Field<TValue, TParent>>[]>;
  /**
   * A signal containing the validation errors of **this field and its descendants**.
  * Fields have no descendants, so this contains the same errors as `errors()`.
  *
  * ℹ️ To read only errors belonging directly to the current node, use `errors()` instead.
   *
   * @example
   * ```ts
   * name.allErrors();
   * // [{ kind: 'required', message: 'Name is required.', targetNode: name }]
   * ```
  */
  allErrors: Signal<readonly ValidationError.WithTargetNode<Node>[]>;
  /** Whether this field has completed validation without errors. False while validity is unknown. */
  valid: Signal<boolean>;
  /** Whether this field currently has at least one validation error. */
  invalid: Signal<boolean>;
  /**
   * Returns the first validation error of this field matching `kind`.
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationError.WithTargetNode<Field<TValue, TParent>> & ValidationErrorMap[TKind]) | undefined;
  /**
   * Returns the first custom error belonging directly to this field and matching `kind`.
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<Field<TValue, TParent>> & CustomValidationError<TKind>) | undefined;
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
  /** Strictest minimum value contributed by active numeric or date validators, or `null` when absent. */
  min: Signal<NonNullable<TValue> | null>;
  /** Strictest maximum value contributed by active numeric or date validators, or `null` when absent. */
  max: Signal<NonNullable<TValue> | null>;
  /** Strictest minimum length contributed by active length validators, or `null` when absent. */
  minLength: Signal<number | null>;
  /** Strictest maximum length contributed by active length validators, or `null` when absent. */
  maxLength: Signal<number | null>;
  /** Every regular expression contributed by the field's active pattern validators. */
  pattern: Signal<readonly RegExp[]>;
  /** Whether an active required validator currently marks this field as required. */
  required: Signal<boolean>;
  /** Whether this field has one or more active asynchronous validation operations. */
  pending: Signal<boolean>;
  /** Whether an ancestor form is currently running its submission action. */
  submitting: Signal<boolean>;
  /**
   * Current validation phase: `'valid'`, `'invalid'`, or `'unknown'`.
   *
   * `'unknown'` means asynchronous validation is pending and no validation error is currently
   * available. While unknown, `pending()` is true and both `valid()` and `invalid()` are false. If
   * an error becomes available while other validation remains pending, the status is `'invalid'`.
   */
  validationStatus: Signal<ValidationStatus>;
  /**
   * Whether this field has been marked touched.
   *
   * ℹ️ A disabled, readonly, or hidden field reports `false` without discarding its stored touched state.
   */
  touched: Signal<boolean>;
  /**
   * Logical inverse of `touched()`.
   *
   * Whether this field currently reports that it has not been touched.
   */
  untouched: Signal<boolean>;
  /** Marks this field as touched, making `touched()` true and `untouched()` false while it is interactive. */
  markAsTouched(options?: {
    /** When true, marks only this field. Fields have no descendants, so this is accepted for API consistency. */
    skipDescendants?: boolean;
  }): void;
  /** Clears stored touched state, making `touched()` false and `untouched()` true. */
  markAsUntouched(): void;
  /**
   * Whether this field currently reports user-modified state.
   *
   * A control-originated value or `markAsDirty()` records dirty state. Programmatic `set()` and
   * `update()` calls do not. A disabled, readonly, or hidden field reports `false` until it becomes
   * interactive again, without discarding the stored state.
   */
  dirty: Signal<boolean>;
  /**
   * Logical inverse of `dirty()`.
   *
   * Whether this field currently reports that it has not been modified through user interaction.
   */
  pristine: Signal<boolean>;
  /** Marks this field as dirty, making `dirty()` true and `pristine()` false while it is interactive. */
  markAsDirty(): void;
  /** Clears stored dirty state, making `dirty()` false and `pristine()` true. */
  markAsPristine(): void;
  /** Whether this field is effectively disabled by its own state or an ancestor reason. */
  disabled: Signal<boolean>;
  /**
   * Active inherited and local causes of this field's disabled state.
   *
   * @example
   * ```ts
   * profile.name.disabledReasons();
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
   * Whether this field has no active local or inherited disabled reason and can participate normally.
   */
  enabled: Signal<boolean>;
  /**
   * Disables this field, optionally recording a user-facing reason.
   * Sets `disabled()` to true and `enabled()` to false.
   *
   * @example Disable without a reason
   * ```ts
   * name.disable();
   * ```
   *
   * @example Disable with a reason
   * ```ts
   * name.disable('Locked');
   * ```
   */
  disable(message?: string): void;
  /**
   * Clears the imperative disabled state created by `disable()`. This makes `enabled()` true and
   * `disabled()` false only when no configured or inherited disabled reason remains active.
   */
  enable(): void;
  /** Whether this field is effectively readonly through its own state or an ancestor. */
  readonly: Signal<boolean>;
  /**
   * Logical inverse of `readonly()`.
   *
   * Whether this field accepts value changes from a bound UI control.
   */
  writable: Signal<boolean>;
  /** Marks this field readonly, making `readonly()` true and `writable()` false. */
  markAsReadonly(): void;
  /**
   * Clears the imperative readonly state. This makes `writable()` true and `readonly()` false only
   * when no configured or inherited readonly state remains active.
   */
  markAsWritable(): void;
  /** Whether this field is effectively hidden through its own state or an ancestor. */
  hidden: Signal<boolean>;
  /**
   * Logical inverse of `hidden()`.
   *
   * Whether this field is currently intended to be shown to the user.
   */
  visible: Signal<boolean>;
  /** Hides this field, making `hidden()` true and `visible()` false without changing its value. */
  hide(): void;
  /**
   * Clears the imperative hidden state. This makes `visible()` true and `hidden()` false only when
   * no configured or inherited hidden state remains active.
   */
  show(): void;
};

export type Field<TValue, TParent extends Node = Node> =
  & Signal<TValue>
  & {
    /** Returns the field's current committed value and participates in signal dependency tracking. */
    (): TValue;
    /**
     * Complete field API and the recommended access path for application code.
     *
    * `$api` exposes the same API through the collision-safe convention shared by every node.
     */
    api: FieldApi<TValue, TParent>;
    /**
     * Collision-safe access to the field API.
     *
     * Prefer `api` for normal application code. `$api` exists as the stable access convention
     * shared by every node, including forms whose children may be named `api`.
     *
     * Prefer `api` for ordinary application code; `$api` remains a supported, stable escape hatch.
     */
    $api: FieldApi<TValue, TParent>;
  }
  & Omit<FieldApi<TValue, TParent>, 'patch'>
  & HiddenFunctionMembers;
