import type { Injector, Signal } from '@angular/core';

import type { MarkAsTouchedOptions, Node, NodeKeyInParent, RootNode } from '../types/node.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { ValidationError, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';

export type FieldOptions<TValue = any> = {
  /** Synchronous and explicitly marked asynchronous validators applied to the field value. */
  readonly validators?: ValidatorSource<TValue>;
  /** Whether the field value includes null. Defaults to true and affects the public value type. */
  readonly nullable?: boolean;
  /** Optional injector that owns the asynchronous validation watcher lifecycle. */
  readonly injector?: Injector;
  /** Delay in milliseconds for updates received through setControlValue(). Overrides an inherited debounce. */
  readonly debounce?: number;
  /** Initial hidden state or a Signal, computed Signal, or function evaluated reactively. */
  readonly hidden?: boolean | (() => boolean);
  /** Initial disabled state or a Signal, computed Signal, or function evaluated reactively. */
  readonly disabled?: boolean | (() => boolean);
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
  /** Strictest minimum value contributed by the field's active numeric or date validators. */
  min: Signal<NonNullable<TValue> | undefined>;
  /** Strictest maximum value contributed by the field's active numeric or date validators. */
  max: Signal<NonNullable<TValue> | undefined>;
  /** Strictest minimum length contributed by the field's active length validators. */
  minLength: Signal<number | undefined>;
  /** Strictest maximum length contributed by the field's active length validators. */
  maxLength: Signal<number | undefined>;
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
  enabled: Signal<boolean>;
  disable(): void;
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
  & { (): TValue; api: FieldApi<TValue, TParent> }
  & Omit<FieldApi<TValue, TParent>, 'patch'>
  & HiddenFunctionMembers;
