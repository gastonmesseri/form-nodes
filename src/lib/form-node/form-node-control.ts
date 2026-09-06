import type { WritableSignal } from '@angular/core';
import type { FormCheckboxControl, FormUiControl, FormValueControl } from '@angular/forms/signals';

import type { Node } from '../types/node.type';
import type { Field } from '../primitives/field';

/**
 * Shared signal-based UI contract for custom controls bound through `[formNode]`.
 *
 * It includes Angular's optional error, interaction-state, validation-state, constraint, name,
 * visibility, touch, focus, and reset channels. Implement only the channels the component
 * supports. Add `node` when the component needs the exact Form Nodes node in addition to those standard
 * channels.
 */
export type FormNodeUiControl<TValue, TNode extends Node = Field<TValue>> = FormUiControl<TValue> & {
  /**
   * Receives the exact field currently bound through `[formNode]`.
   *
   * Use this optional signal to derive `disabled`, `readonly`, `required`, validation,
   * and other field state directly inside the custom control.
   */
  node?: WritableSignal<TNode | null>;
};

/**
 * Custom-control contract whose primary two-way `model()` is named `value`.
 *
 * `[formNode]` writes committed node values to the model and observes model changes from the
 * control. Combine it with the optional channels inherited from `FormNodeUiControl` as needed.
 */
export type FormNodeValueControl<TValue, TNode extends Node = Field<TValue>> = FormValueControl<TValue> & FormNodeUiControl<TValue, TNode>;

/**
 * Boolean custom-control contract whose primary two-way `model()` is named `checked`.
 *
 * Use it for checkbox-like controls; `[formNode]` synchronizes `checked` with the bound field.
 */
export type FormNodeCheckboxControl<TNode extends Node = Field<boolean>> = FormCheckboxControl & FormNodeUiControl<boolean, TNode>;

/**
 * Either value-based or, for boolean values, checkbox-based custom control recognized by
 * `[formNode]`.
 */
export type FormNodeControl<TValue = any, TNode extends Node = Field<TValue>> = FormNodeValueControl<TValue, TNode> | ([TValue] extends [boolean] ? FormNodeCheckboxControl<TNode> : never);
