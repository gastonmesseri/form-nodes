import type { Injector, Signal } from '@angular/core';

import type { MarkAsTouchedOptions, Node, RootNode } from '../types/node.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { ValidationError, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';

export type FieldOptions<TValue = any> = {
  /** Synchronous and explicitly marked asynchronous validators applied to the field value. */
  readonly validators?: ValidatorSource<TValue>;
  /** Whether the field value includes null. Defaults to true and affects the public value type. */
  readonly nullable?: boolean;
  /** Optional injector that owns the asynchronous validation watcher lifecycle. */
  readonly injector?: Injector;
  /** Delay in milliseconds for updates received through setControlValue(). */
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
  patch(value: TValue): void;
  reset(...args: [] | [value: TValue]): void;
  validators: Signal<Validators<TValue>>;
  setValidators(validators: ValidatorSource<TValue>): void;
  errors: Signal<readonly ValidationError.WithTargetNode<Field<TValue, TParent>>[]>;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<Field<TValue, TParent>> & { readonly kind: TKind }) | undefined;
  required: Signal<boolean>;
  pending: Signal<boolean>;
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
