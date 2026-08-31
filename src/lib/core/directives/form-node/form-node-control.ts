import type { FormCheckboxControl, FormUiControl, FormValueControl } from '@angular/forms/signals';
import { InjectionToken, forwardRef, type ExistingProvider, type ForwardRefFn, type WritableSignal } from '@angular/core';

import type { Field } from '../../primitives/field';

export type FormNodeUiControl<TValue> = FormUiControl<TValue> & {
  /**
   * Receives the exact field currently bound through `[formNode]`.
   *
   * Use this optional signal to derive `disabled`, `readonly`, `required`, validation,
   * and other field state directly inside the custom control.
   */
  node?: WritableSignal<Field<TValue> | null>;
};

/** A signal-based custom control whose primary two-way model is named `value`. */
export type FormNodeValueControl<TValue> = FormValueControl<TValue> & FormNodeUiControl<TValue>;

/** A signal-based boolean custom control whose primary two-way model is named `checked`. */
export type FormNodeCheckboxControl = FormCheckboxControl & FormNodeUiControl<boolean>;

/** Signal-based custom-control contract recognized by `[formNode]`. */
export type FormNodeControl<TValue = any> = FormNodeValueControl<TValue> | ([TValue] extends [boolean] ? FormNodeCheckboxControl : never);

/** Injection token used by `[formNode]` to discover a signal-based custom control on its host. */
export const FORM_NODE_CONTROL = new InjectionToken<FormNodeControl>('FORM_NODE_CONTROL');

/**
 * Explicitly registers the host component as the signal-based control used by `[formNode]`.
 *
 * Prefer this provider when the component must remain reliably discoverable independently of
 * Angular's compiled component-metadata discovery. Standard `FormValueControl` and
 * `FormCheckboxControl` components are otherwise discovered automatically.
 *
 * The optional `node` signal from `FormNodeValueControl` or `FormNodeCheckboxControl` can be used
 * when the component needs direct access to the exact bound field and wants to derive its own UI
 * state from that field.
 *
 * @example
 * `providers: [provideFormNodeControl(() => DatePicker)]`
 */
export const provideFormNodeControl = (control: ForwardRefFn): ExistingProvider => ({
  provide: FORM_NODE_CONTROL,
  useExisting: forwardRef(control),
});
