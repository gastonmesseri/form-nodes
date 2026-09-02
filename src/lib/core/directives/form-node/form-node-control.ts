import type { FormCheckboxControl, FormUiControl, FormValueControl } from '@angular/forms/signals';
import { InjectionToken, forwardRef, type ExistingProvider, type Type, type WritableSignal } from '@angular/core';

import type { Field } from '../../primitives/field';
import type { Node } from '../../types/node.type';

export type FormNodeUiControl<TValue, TNode extends Node = Field<TValue>> = FormUiControl<TValue> & {
  /**
   * Receives the exact field currently bound through `[formNode]`.
   *
   * Use this optional signal to derive `disabled`, `readonly`, `required`, validation,
   * and other field state directly inside the custom control.
   */
  node?: WritableSignal<TNode | null>;
};

/** A signal-based custom control whose primary two-way model is named `value`. */
export type FormNodeValueControl<TValue, TNode extends Node = Field<TValue>> = FormValueControl<TValue> & FormNodeUiControl<TValue, TNode>;

/** A signal-based boolean custom control whose primary two-way model is named `checked`. */
export type FormNodeCheckboxControl<TNode extends Node = Field<boolean>> = FormCheckboxControl & FormNodeUiControl<boolean, TNode>;

/** Signal-based custom-control contract recognized by `[formNode]`. */
export type FormNodeControl<TValue = any, TNode extends Node = Field<TValue>> = FormNodeValueControl<TValue, TNode> | ([TValue] extends [boolean] ? FormNodeCheckboxControl<TNode> : never);

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
 * @example Explicitly register a signal-based custom control.
 * ```ts
 * import { Component, input, model, output } from '@angular/core';
 *
 * import { provideFormNodeControl, type FormNodeValueControl } from '@gem/ng-forms';
 *
 * @Component({
 *   selector: 'app-date-picker',
 *   providers: [provideFormNodeControl(() => DatePicker)],
 *   template: `
 *     <input
 *       type="date"
 *       [value]="value() ?? ''"
 *       [disabled]="disabled()"
 *       (input)="select($any($event.target).value)"
 *       (blur)="touch.emit()"
 *     >
 *   `,
 * })
 * export class DatePicker implements FormNodeValueControl<string | null> {
 *   value = model<string | null>(null);
 *   disabled = input(false);
 *   touch = output<void>();
 *
 *   select(value: string) {
 *     this.value.set(value || null);
 *   }
 * }
 * ```
 *
 * @param control Deferred custom-control component type. The function avoids referencing the component before its declaration is initialized.
 */
export const provideFormNodeControl = (control: () => Type<unknown>): ExistingProvider => ({
  provide: FORM_NODE_CONTROL,
  useExisting: forwardRef(control),
});
