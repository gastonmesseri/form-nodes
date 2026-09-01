import type { Injector, Signal } from '@angular/core';

import type { OpaqueAngularField } from '../interop/angular-field.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { DisabledReason, Node, NodeKeyInParent, RootNode } from '../types/node.type';
import type { CustomValidationError, ValidationError, ValidationErrorMap, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';

export type FieldOptions<TValue = any> = {
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
  validators?: ValidatorSource<TValue>;
  /** Whether the field value includes null. Defaults to true and affects the public value type. */
  nullable?: boolean;
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
  /** Complete root node containing this field, or `null` while the field is a detached root. */
  form: Signal<RootNode<TParent> | null>;
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
   * Current committed field value.
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
   * Computes and sets a complete value from the current committed value without marking the field dirty.
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
   * the committed value; omitting it preserves the current committed value.
   */
  reset(...args: [] | [value: TValue]): void;
  /** Current normalized validators assigned directly to this field, in declaration order. */
  validators: Signal<Validators<TValue>>;
  /** Replaces this field's validators and immediately validates the current committed value. */
  setValidators(validators: ValidatorSource<TValue>): void;
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
  & Omit<FieldApi<TValue, TParent>, 'patch'>
  & HiddenFunctionMembers;
