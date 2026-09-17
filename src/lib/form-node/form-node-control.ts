import type { InputSignal, InputSignalWithTransform, ModelSignal, OutputRef, WritableSignal } from '@angular/core';

import type { FieldNode } from '../primitives/field';
import type { AnyNode, DisabledReason } from '../types/node.type';
import type { ValidationError } from '../validation/validation.type';

/**
 * Optional state inputs and interaction hooks recognized by `[formNode]` on Angular 21 and 22.
 *
 * ```ts
 * import { model } from '@angular/core';
 * import { Component } from '@angular/core';
 *
 * @Component({
 *   selector: 'custom-control',
 *   template: '',
 * })
 * export class CustomControl
 *   implements FormNodeValueControl<string>
 * {
 *   value = model('');
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   disabled = input(false);
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   readonly = input(false);
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   hidden = input(false);
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   invalid = input(false);
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   pending = input(false);
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   touched = input(false);
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   dirty = input(false);
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   required = input(false);
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   errors = input<
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   disabledReasons = input<
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   name = input('');
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   min = input<number | undefined>(
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   max = input<number | undefined>(
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   minLength = input<number | undefined>(
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   maxLength = input<number | undefined>(
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
   * import { input } from '@angular/core';
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   pattern = input<readonly RegExp[]>([]);
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
   * import { model } from '@angular/core';
   * import { output } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   touch = output<void>();
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
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   * import { viewChild } from '@angular/core';
   * import { ElementRef } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '<input #input />',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   element =
   *     viewChild<
   *       ElementRef<HTMLInputElement>
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
   * import { model } from '@angular/core';
   * import { signal } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   expanded = signal(false);
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
   * import { model } from '@angular/core';
   * import { signal } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
   *
   *   node = signal<FieldNode<string> | null>(
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
 * import { model } from '@angular/core';
 * import { Component } from '@angular/core';
 *
 * @Component({
 *   selector: 'custom-control',
 *   template: '',
 * })
 * export class CustomControl
 *   implements FormNodeValueControl<string>
 * {
 *   value = model('');
 * }
 * ```
 */
export type FormNodeValueControl<TValue, TNode extends AnyNode = FieldNode<TValue>> = FormNodeUiControl<TValue, TNode> & {
  /**
   * The rendered value, including pending debounced input.
   *
   * ```ts
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   value = model('');
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
 * import { model } from '@angular/core';
 * import { Component } from '@angular/core';
 *
 * @Component({
 *   selector: 'custom-control',
 *   template: '',
 * })
 * export class CustomControl
 *   implements FormNodeCheckboxControl
 * {
 *   checked = model(false);
 * }
 * ```
 */
export type FormNodeCheckboxControl<TNode extends AnyNode = FieldNode<boolean>> = FormNodeUiControl<boolean, TNode> & {
  /**
   * The rendered checked state.
   *
   * ```ts
   * import { model } from '@angular/core';
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'custom-control',
   *   template: '',
   * })
   * export class CustomControl {
   *   checked = model(false);
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
 * import { model } from '@angular/core';
 * import { Component } from '@angular/core';
 *
 * @Component({
 *   selector: 'custom-control',
 *   template: '',
 * })
 * export class CustomControl
 *   implements FormNodeValueControl<string>
 * {
 *   value = model('');
 * }
 * ```
 */
export type FormNodeControl<TValue = any, TNode extends AnyNode = FieldNode<TValue>> = FormNodeValueControl<TValue, TNode> | ([TValue] extends [boolean] ? FormNodeCheckboxControl<TNode> : never);
