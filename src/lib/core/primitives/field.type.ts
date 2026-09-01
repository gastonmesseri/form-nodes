import type { Injector, Signal } from '@angular/core';

import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { ValidationError, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';
import type { DisabledReason, MarkAsTouchedOptions, Node, NodeKeyInParent, RootNode } from '../types/node.type';

export type FieldOptions<TValue = any> = {
  /** Synchronous and explicitly marked asynchronous validators applied to the field value. */
  readonly validators?: ValidatorSource<TValue>;
  /** Whether the field value includes null. Defaults to true and affects the public value type. */
  readonly nullable?: boolean;
  /** Optional injector that owns the asynchronous validation watcher lifecycle. */
  readonly injector?: Injector;
  /** Delay strategy for control updates. A number waits in milliseconds; `'blur'` commits when the control loses focus. Overrides an inherited debounce. */
  readonly debounce?: number | 'blur';
  /** Initial hidden state or a Signal, computed Signal, or function evaluated reactively. */
  readonly hidden?: boolean | (() => boolean);
  /** Initial or reactive disabled state. A string disables the field and describes the reason. */
  readonly disabled?: boolean | string | (() => boolean | string);
  /** Initial readonly state or a Signal, computed Signal, or function evaluated reactively. */
  readonly readonly?: boolean | (() => boolean);
};

export type FieldApi<TValue, TParent extends Node = Node> = {
  form: Signal<RootNode<TParent> | null>;
  parent: Signal<TParent | null>;
  path: Signal<readonly string[]>;
  /**
   * Property or array index under which this field is stored, or `null` when it is a root field.
   *
   * @example
   * `myForm.age.keyInParent()` returns `'age'`.
   */
  keyInParent: Signal<NodeKeyInParent<TParent>>;
  value: Signal<TValue>;
  /**
   * Immediate value buffered from the bound UI control before any configured debounce completes.
   * Most consumers should read value() instead; controlValue() is primarily intended for control bindings.
   */
  controlValue: Signal<TValue>;
  set(value: TValue): void;
  /** Computes and sets a complete value from the current committed value without marking the field dirty. */
  update(updater: (value: TValue) => TValue): void;
  setControlValue(value: TValue): void;
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
  patch(value: TValue): void;
  reset(...args: [] | [value: TValue]): void;
  validators: Signal<Validators<TValue>>;
  setValidators(validators: ValidatorSource<TValue>): void;
  /**
   * A signal containing the validation errors of **this field itself**.
   *
   * ℹ️ To work consistently with aggregate nodes, use `allErrors()` instead.
   */
  errors: Signal<readonly ValidationError.WithTargetNode<Field<TValue, TParent>>[]>;
  /**
   * A signal containing the validation errors of **this field and its descendants**.
   * Fields have no descendants, so this contains the same errors as `errors()`.
   *
   * ℹ️ To read only errors belonging directly to the current node, use `errors()` instead.
   */
  allErrors: Signal<readonly ValidationError.WithTargetNode<Node>[]>;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  /**
   * Returns the first validation error of this field matching `kind`.
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<Field<TValue, TParent>> & { readonly kind: TKind }) | undefined;
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
  required: Signal<boolean>;
  pending: Signal<boolean>;
  /** Whether an ancestor form is currently running its submission action. */
  submitting: Signal<boolean>;
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
  /** Active inherited and local causes of this field's disabled state. */
  disabledReasons: Signal<readonly DisabledReason[]>;
  enabled: Signal<boolean>;
  /** Disables this field, optionally recording a user-facing reason. */
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

export type Field<TValue, TParent extends Node = Node> =
  & {
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
     * This property is not obsolete and is not planned for removal. It is marked as deprecated
     * only to reduce its prominence in autocomplete and keep the usual `api` access easier to find.
     *
     * @deprecated Not actually deprecated. Prefer `api` unless collision-safe access is required.
     */
    $api: FieldApi<TValue, TParent>;
  }
  & Omit<FieldApi<TValue, TParent>, 'patch'>
  & HiddenFunctionMembers;
