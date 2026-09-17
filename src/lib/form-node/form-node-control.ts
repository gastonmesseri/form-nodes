import type { InputSignal, InputSignalWithTransform, ModelSignal, OutputRef, WritableSignal } from '@angular/core';

import type { FieldNode } from '../primitives/field';
import type { AnyNode, DisabledReason } from '../types/node.type';
import type { ValidationError } from '../validation/validation.type';

/**
 * Optional state inputs and interaction hooks recognized by `[formNode]` on Angular 21 and 22.
 *
 * ```ts
 * import * as ng from '@angular/core';
 *
 * @ng.Component({
 *   selector: 'custom-control',
 *   template: '',
 * })
 * export class CustomControl
 *   implements FormNodeValueControl<string>
 * {
 *   value = ng.model('');
 * }
 * ```
 */
export type FormNodeUiControl<TValue, TNode extends AnyNode = FieldNode<TValue>> = {
  /**
   * Node disabled state.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   disabled = ng.input(false);
   * }
   * ```
   */
  disabled?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /**
   * Node readonly state.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   readonly = ng.input(false);
   * }
   * ```
   */
  readonly?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /**
   * Node hidden state.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   hidden = ng.input(false);
   * }
   * ```
   */
  hidden?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /**
   * Node invalid state.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   invalid = ng.input(false);
   * }
   * ```
   */
  invalid?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /**
   * Node pending state.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   pending = ng.input(false);
   * }
   * ```
   */
  pending?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /**
   * Node touched state.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   touched = ng.input(false);
   * }
   * ```
   */
  touched?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /**
   * Node dirty state.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   dirty = ng.input(false);
   * }
   * ```
   */
  dirty?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /**
   * Node required state.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   required = ng.input(false);
   * }
   * ```
   */
  required?: InputSignal<boolean> | InputSignalWithTransform<boolean, unknown>;

  /**
   * Validation errors on the bound node.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   errors = ng.input<
   *     readonly ValidationError[]
   *   >([]);
   * }
   * ```
   */
  errors?: InputSignal<readonly ValidationError[]> | InputSignalWithTransform<readonly ValidationError[], unknown>;

  /**
   * Active disabled reasons and their originating nodes.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   disabledReasons = ng.input<
   *     readonly DisabledReason[]
   *   >([]);
   * }
   * ```
   */
  disabledReasons?: InputSignal<readonly DisabledReason[]> | InputSignalWithTransform<readonly DisabledReason[], unknown>;

  /**
   * Name of the bound node.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   name = ng.input('');
   * }
   * ```
   */
  name?: InputSignal<string> | InputSignalWithTransform<string, unknown>;

  /**
   * Active minimum constraint.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   min = ng.input<number | undefined>(
   *     undefined,
   *   );
   * }
   * ```
   */
  min?: InputSignal<NonNullable<TValue> | undefined> | InputSignalWithTransform<NonNullable<TValue> | undefined, unknown>;

  /**
   * Active maximum constraint.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   max = ng.input<number | undefined>(
   *     undefined,
   *   );
   * }
   * ```
   */
  max?: InputSignal<NonNullable<TValue> | undefined> | InputSignalWithTransform<NonNullable<TValue> | undefined, unknown>;

  /**
   * Active minimum length.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   minLength = ng.input<number | undefined>(
   *     undefined,
   *   );
   * }
   * ```
   */
  minLength?: InputSignal<number | undefined> | InputSignalWithTransform<number | undefined, unknown>;

  /**
   * Active maximum length.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   maxLength = ng.input<number | undefined>(
   *     undefined,
   *   );
   * }
   * ```
   */
  maxLength?: InputSignal<number | undefined> | InputSignalWithTransform<number | undefined, unknown>;

  /**
   * Active pattern constraints.
   *
   * **Default:** No matching input is written when omitted. Optional input synchronization is disabled unless `syncInputs` selects it.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   pattern = ng.input<readonly RegExp[]>([]);
   * }
   * ```
   */
  pattern?: InputSignal<readonly RegExp[]> | InputSignalWithTransform<readonly RegExp[], unknown>;

  /**
   * Reports blur or another completed user interaction.
   *
   * **Default:** No touch output; the control may call its state facade to report touch instead.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   touch = ng.output<void>();
   *
   *   onBlur() {
   *     this.touch.emit();
   *   }
   * }
   * ```
   */
  touch?: OutputRef<void>;

  /**
   * Focuses the component's interactive element.
   *
   * **Default:** Focus the component host when no hook is implemented.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '<input #input />',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   element =
   *     ng.viewChild<
   *       ng.ElementRef<HTMLInputElement>
   *     >('input');
   *
   *   focus(options?: FocusOptions) {
   *     this.element()?.nativeElement.focus(
   *       options,
   *     );
   *   }
   * }
   * ```
   */
  focus?(options?: FocusOptions): void;

  /**
   * Clears component-owned transient UI state when the node resets.
   *
   * **Default:** No component-specific reset hook.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   expanded = ng.signal(false);
   *
   *   reset() {
   *     this.expanded.set(false);
   *   }
   * }
   * ```
   */
  reset?(): void;

  /**
   * Optionally receives the bound node for direct state access.
   *
   * **Default:** No writable node reference is populated.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   *
   *   node = ng.signal<FieldNode<string> | null>(
   *     null,
   *   );
   * }
   * ```
   */
  node?: WritableSignal<TNode | null>;
};

/**
 * A custom control exposing a `value` model for `[formNode]`.
 *
 * ```ts
 * import * as ng from '@angular/core';
 *
 * @ng.Component({
 *   selector: 'custom-control',
 *   template: '',
 * })
 * export class CustomControl
 *   implements FormNodeValueControl<string>
 * {
 *   value = ng.model('');
 * }
 * ```
 */
export type FormNodeValueControl<TValue, TNode extends AnyNode = FieldNode<TValue>> = FormNodeUiControl<TValue, TNode> & {
  /**
   * The rendered value, including pending debounced input.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = ng.model('');
   * }
   * ```
   */
  value: ModelSignal<TValue>;
  /** Reserved for checkbox controls. */
  checked?: undefined;
};

/**
 * A custom control exposing a boolean `checked` model for `[formNode]`.
 *
 * ```ts
 * import * as ng from '@angular/core';
 *
 * @ng.Component({
 *   selector: 'custom-control',
 *   template: '',
 * })
 * export class CustomControl
 *   implements FormNodeCheckboxControl
 * {
 *   checked = ng.model(false);
 * }
 * ```
 */
export type FormNodeCheckboxControl<TNode extends AnyNode = FieldNode<boolean>> = FormNodeUiControl<boolean, TNode> & {
  /**
   * The rendered checked state.
   *
   * ```ts
   * import * as ng from '@angular/core';
   *
   * @ng.Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   checked = ng.model(false);
   * }
   * ```
   */
  checked: ModelSignal<boolean>;
  /** Reserved for value controls. */
  value?: undefined;
};

/**
 * Either a value control or, for boolean values, a checkbox control recognized by `[formNode]`.
 *
 * ```ts
 * import * as ng from '@angular/core';
 *
 * @ng.Component({
 *   selector: 'custom-control',
 *   template: '',
 * })
 * export class CustomControl
 *   implements FormNodeValueControl<string>
 * {
 *   value = ng.model('');
 * }
 * ```
 */
export type FormNodeControl<TValue = any, TNode extends AnyNode = FieldNode<TValue>> = FormNodeValueControl<TValue, TNode> | ([TValue] extends [boolean] ? FormNodeCheckboxControl<TNode> : never);
