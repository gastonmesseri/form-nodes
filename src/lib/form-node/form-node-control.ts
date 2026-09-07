import type { InputSignal, InputSignalWithTransform, ModelSignal, OutputRef, WritableSignal } from '@angular/core';

import type { Field } from '../primitives/field';
import type { Node, DisabledReason } from '../types/node.type';
import type { ValidationError } from '../validation/validation.type';

/** Optional state inputs and interaction hooks recognized by `[formNode]` on Angular 21 and 22. */
export type FormNodeUiControl<TValue, TNode extends Node = Field<TValue>> = {
  /** Node disabled state. */
  disabled?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /** Node readonly state. */
  readonly?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /** Node hidden state. */
  hidden?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /** Node invalid state. */
  invalid?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /** Node pending state. */
  pending?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /** Node touched state. */
  touched?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /** Node dirty state. */
  dirty?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /** Node required state. */
  required?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /** Validation errors on the bound node. */
  errors?: InputSignal<readonly ValidationError[]> | InputSignalWithTransform<readonly ValidationError[], unknown>;

  /** Active disabled reasons and their originating nodes. */
  disabledReasons?: InputSignal<readonly DisabledReason[]> | InputSignalWithTransform<readonly DisabledReason[], unknown>;

  /** Name of the bound node. */
  name?: InputSignal<string> | InputSignalWithTransform<string, unknown>;

  /** Active minimum constraint. */
  min?: InputSignal<NonNullable<TValue> | undefined> | InputSignalWithTransform<NonNullable<TValue> | undefined, unknown>;

  /** Active maximum constraint. */
  max?: InputSignal<NonNullable<TValue> | undefined> | InputSignalWithTransform<NonNullable<TValue> | undefined, unknown>;

  /** Active minimum length. */
  minLength?: InputSignal<number | undefined> | InputSignalWithTransform<number | undefined, unknown>;

  /** Active maximum length. */
  maxLength?: InputSignal<number | undefined> | InputSignalWithTransform<number | undefined, unknown>;

  /** Active pattern constraints. */
  pattern?: InputSignal<readonly RegExp[]> | InputSignalWithTransform<readonly RegExp[], unknown>;

  /** Reports blur or another completed user interaction. */
  touch?: OutputRef<void>;

  /** Focuses the component's interactive element. */
  focus?(options?: FocusOptions): void;

  /** Clears component-owned transient UI state when the node resets. */
  reset?(): void;

  /** Optionally receives the bound node for direct state access. */
  node?: WritableSignal<TNode | null>;
};

/** A custom control exposing a `value` model for `[formNode]`. */
export type FormNodeValueControl<TValue, TNode extends Node = Field<TValue>> = FormNodeUiControl<TValue, TNode> & {
  /** The rendered value, including pending debounced input. */
  value: ModelSignal<TValue>;
  /** Reserved for checkbox controls. */
  checked?: undefined;
};

/** A custom control exposing a boolean `checked` model for `[formNode]`. */
export type FormNodeCheckboxControl<TNode extends Node = Field<boolean>> = FormNodeUiControl<boolean, TNode> & {
  /** The rendered checked state. */
  checked: ModelSignal<boolean>;
  /** Reserved for value controls. */
  value?: undefined;
};

/** Either a value control or, for boolean values, a checkbox control recognized by `[formNode]`. */
export type FormNodeControl<TValue = any, TNode extends Node = Field<TValue>> = FormNodeValueControl<TValue, TNode> | ([TValue] extends [boolean] ? FormNodeCheckboxControl<TNode> : never);
