import { InjectionToken, type Provider } from '@angular/core';

import type { FormNodeBinding } from '../types/form-node-binding.type';
import type { SyncInputs, SyncInputName } from '../configuration/node-input-config';
import { VALIDATOR_MESSAGES, type ValidatorMessages } from '../validation/validator-messages';

export type { FormNodeBinding } from '../types/form-node-binding.type';

/** Injector-scoped validator messages and configuration for `[formNode]` bindings. */
export type FormNodesConfig = {
  /**
   * A partial catalog or a factory executed in Angular DI. Omission inherits; null supplies an empty provider catalog.
   *
   * **Default:** Omission inherits the nearest provider or global fallback.
   *
   * ```ts
   * provideFormNodesConfig({
   *   validatorMessages: {
   *     required: 'Required.',
   *   },
   * });
   * ```
   */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages) | null | undefined;

  /**
   * Reactively copies node state and constraints into matching custom-control inputs. This is
   * one-way node-to-component synchronization; it does not enable value binding, execute
   * validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs.
   *
   * **Default:** Omission inherits the next configuration layer; the final fallback is `false`.
   *
   * **Accepted values:**
   *
   * - `false` or `null`: no additional input writes, even if inherited configuration enables them.
   * - `'declared'`: initial `disabled`, `readonly`, and `hidden` node options select their inputs.
   *   Explicit false counts; undefined does not. Declaring disabled also selects disabledReasons.
   *   Validators never select inputs in this preset, including initial built-in validators.
   * - `'all'`: every supported input exposed by the selected control, including validator constraints.
   * - `'signal-controls'`: all supported inputs, only when the selected adapter connects an actual
   *   `value` or `checked` model. A CVA takes precedence even if its component also exposes a model.
   * - `['disabled', 'required']`: exactly those supported inputs, regardless of initial declarations.
   * - `{ inputs, target }`: inputs is `'declared'`, `'all'`, or a list; target is `'all'` (default),
   *   `'signal-controls'`, or `'cva'`. Target filters the selected adapter; it never changes priority.
   *   The signal-controls preset is shorthand for `{ inputs: 'all', target: 'signal-controls' }`.
   * - `[]` or `{ inputs: [] }`: no additional writes. Empty lists never enable value connections.
   *
   * Provider and global defaults are captured on connection. Node options override providers;
   * parent node options do not configure descendants. Lists and objects replace inherited selections.
   * Rebinding applies the new selection; inputs no longer selected retain their last values.
   *
   * Selected writes may replace component defaults and explicit template bindings. CVA value and
   * disabled-state integration remain independent. Use {@link useFormNodeState} for state observation.
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: false,
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: 'declared',
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: 'all',
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: 'signal-controls',
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: ['required', 'minLength'],
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: {
   *     inputs: ['required'],
   *     target: 'cva',
   *   },
   * });
   * ```
   *
   * @experimental Custom-control input writes depend on Angular internals.
   * @see {@link https://form-nodes.js.org/reference/provide-form-nodes-config | Binding configuration}
   */
  syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | { inputs: 'declared' | 'all' | readonly SyncInputName[]; target?: 'all' | 'signal-controls' | 'cva' | undefined } | null | undefined;

  /**
   * Connects recognized value/valueChange or checked/checkedChange input/output pairs.
   * CVAs and actual model signals keep priority. Enabling a pair connects values and interaction
   * hooks; optional state inputs are selected independently by `syncInputs`.
   *
   * **Default:** Omission inherits the next configuration layer; the final fallback is `false`.
   *
   * **Accepted values:**
   *
   * - `true`: Connect the pair, including touch and optional focus/reset/node hooks.
   * - `false` or `null`: Disable pair connections, overriding inherited settings.
   * - `undefined`: Inherit factory, provider, or global configuration as applicable.
   *
   * Provider/global defaults are captured on connection; parent node options do not configure
   * descendants. Rebinding releases old subscriptions and node references. Inactive pairs retain
   * component input values, so use initialized inputs rather than required inputs.
   *
   * ```ts
   * provideFormNodesConfig({
   *   bindInputOutputPairs: true,
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   bindInputOutputPairs: false,
   * });
   * ```
   *
   * @experimental Custom-control input writes depend on Angular internals.
   * @see {@link https://form-nodes.js.org/reference/provide-form-nodes-config | Binding configuration}
   */
  bindInputOutputPairs?: boolean | null | undefined;

  /**
   * CSS class names and their reactive activation predicates. Omission inherits; an explicit map replaces inherited classes; null clears classes.
   *
   * Each predicate runs in a reactive context. Signals read from the binding or elsewhere cause
   * that class to be reevaluated without reevaluating unrelated class predicates. The classes
   * apply to `[formNode]` bindings.
   *
   * **Default:** Omission inherits the nearest provider or global fallback.
   *
   * ```ts
   * provideFormNodesConfig({
   *   classes: {
   *     'has-errors': binding => {
   *       return binding.errors().length > 0;
   *     },
   *   },
   * });
   * ```
   */
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
};

/**
 * Reactive Forms-compatible status classes for use with `provideFormNodesConfig()`.
 *
 * ```ts
 * provideFormNodesConfig({
 *   classes: ANGULAR_FORMS_STATUS_CLASSES,
 * });
 * ```
 */
export const ANGULAR_FORMS_STATUS_CLASSES: NonNullable<FormNodesConfig['classes']> = {
  'ng-touched': (binding) => {
    return binding.node().$api.touched();
  },
  'ng-untouched': (binding) => {
    return binding.node().$api.untouched();
  },
  'ng-dirty': (binding) => {
    return binding.node().$api.dirty();
  },
  'ng-pristine': (binding) => {
    return binding.node().$api.pristine();
  },
  'ng-valid': (binding) => {
    return binding.node().$api.valid();
  },
  'ng-invalid': (binding) => {
    return binding.node().$api.invalid();
  },
  'ng-pending': (binding) => {
    return binding.node().$api.pending();
  },
};

/* Each option has its own token so omitted options inherit independently. */
export const FORM_NODE_CLASSES = new InjectionToken<NonNullable<FormNodesConfig['classes']>>('FORM_NODE_CLASSES');

export const FORM_NODE_SYNC_INPUTS = new InjectionToken<SyncInputs>('FORM_NODE_SYNC_INPUTS');
export const FORM_NODE_BIND_INPUT_OUTPUT_PAIRS = new InjectionToken<boolean>('FORM_NODE_BIND_INPUT_OUTPUT_PAIRS');

/**
 * Configures validator messages and `[formNode]` bindings in an application, route, module, or component.
 * Message factories run in an injection context. Each omitted option preserves its inherited provider.
 * Explicit classes replace the inherited class map without changing messages or input synchronization.
 * Null restores the selected option: no classes, synchronization disabled, or an empty message catalog.
 * An empty config registers no providers; use classes: {} to explicitly clear inherited classes.
 * Angular's `provideSignalFormsConfig()` independently configures `[formField]` bindings.
 *
 * ```ts
 * import { Component } from '@angular/core';
 *
 * @Component({
 *   providers: [
 *     provideFormNodesConfig({
 *       validatorMessages: {
 *         required: 'Required.',
 *       },
 *     }),
 *   ],
 *   template: '',
 * })
 * export class ProfilePage {}
 * ```
 *
 * @param config Message and binding configuration installed in the current Angular injector scope.
 */
export const provideFormNodesConfig = (config: {
  /**
   * Partial message catalog or a factory that may inject services. Omission inherits; null supplies an empty provider catalog.
   *
   * **Default:** Omission inherits the nearest provider or global fallback.
   *
   * ```ts
   * provideFormNodesConfig({
   *   validatorMessages: {
   *     required: 'Required.',
   *   },
   * });
   * ```
   */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages) | null | undefined;

  /**
   * Reactively copies node state and constraints into matching custom-control inputs. This is
   * one-way node-to-component synchronization; it does not enable value binding, execute
   * validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs.
   *
   * **Default:** Omission inherits the next configuration layer; the final fallback is `false`.
   *
   * **Accepted values:**
   *
   * - `false` or `null`: no additional input writes, even if inherited configuration enables them.
   * - `'declared'`: initial `disabled`, `readonly`, and `hidden` node options select their inputs.
   *   Explicit false counts; undefined does not. Declaring disabled also selects disabledReasons.
   *   Validators never select inputs in this preset, including initial built-in validators.
   * - `'all'`: every supported input exposed by the selected control, including validator constraints.
   * - `'signal-controls'`: all supported inputs, only when the selected adapter connects an actual
   *   `value` or `checked` model. A CVA takes precedence even if its component also exposes a model.
   * - `['disabled', 'required']`: exactly those supported inputs, regardless of initial declarations.
   * - `{ inputs, target }`: inputs is `'declared'`, `'all'`, or a list; target is `'all'` (default),
   *   `'signal-controls'`, or `'cva'`. Target filters the selected adapter; it never changes priority.
   *   The signal-controls preset is shorthand for `{ inputs: 'all', target: 'signal-controls' }`.
   * - `[]` or `{ inputs: [] }`: no additional writes. Empty lists never enable value connections.
   *
   * Provider and global defaults are captured on connection. Node options override providers;
   * parent node options do not configure descendants. Lists and objects replace inherited selections.
   * Rebinding applies the new selection; inputs no longer selected retain their last values.
   *
   * Selected writes may replace component defaults and explicit template bindings. CVA value and
   * disabled-state integration remain independent. Use {@link useFormNodeState} for state observation.
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: false,
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: 'declared',
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: 'all',
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: 'signal-controls',
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: ['required', 'minLength'],
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   syncInputs: {
   *     inputs: ['required'],
   *     target: 'cva',
   *   },
   * });
   * ```
   *
   * @experimental Custom-control input writes depend on Angular internals.
   * @see {@link https://form-nodes.js.org/reference/provide-form-nodes-config | Binding configuration}
   */
  syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | { inputs: 'declared' | 'all' | readonly SyncInputName[]; target?: 'all' | 'signal-controls' | 'cva' | undefined } | null | undefined;

  /**
   * Connects recognized value/valueChange or checked/checkedChange input/output pairs.
   * CVAs and actual model signals keep priority. Enabling a pair connects values and interaction
   * hooks; optional state inputs are selected independently by `syncInputs`.
   *
   * **Default:** Omission inherits the next configuration layer; the final fallback is `false`.
   *
   * **Accepted values:**
   *
   * - `true`: Connect the pair, including touch and optional focus/reset/node hooks.
   * - `false` or `null`: Disable pair connections, overriding inherited settings.
   * - `undefined`: Inherit factory, provider, or global configuration as applicable.
   *
   * Provider/global defaults are captured on connection; parent node options do not configure
   * descendants. Rebinding releases old subscriptions and node references. Inactive pairs retain
   * component input values, so use initialized inputs rather than required inputs.
   *
   * ```ts
   * provideFormNodesConfig({
   *   bindInputOutputPairs: true,
   * });
   * ```
   *
   * ```ts
   * provideFormNodesConfig({
   *   bindInputOutputPairs: false,
   * });
   * ```
   *
   * @experimental Custom-control input writes depend on Angular internals.
   * @see {@link https://form-nodes.js.org/reference/provide-form-nodes-config | Binding configuration}
   */
  bindInputOutputPairs?: boolean | null | undefined;

  /**
   * Reactive class predicates. Omission inherits the map; an explicit map replaces it, and null or {} clears it.
   *
   * **Default:** Omission inherits the nearest provider or global fallback.
   *
   * ```ts
   * provideFormNodesConfig({
   *   classes: {
   *     'has-errors': binding => {
   *       return binding.errors().length > 0;
   *     },
   *   },
   * });
   * ```
   */
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
}): Provider[] => {
  const providers: Provider[] = [];
  if (config.classes !== undefined) {
    providers.push({ provide: FORM_NODE_CLASSES, useValue: config.classes ?? {} });
  }
  if (config.syncInputs !== undefined) {
    providers.push({ provide: FORM_NODE_SYNC_INPUTS, useValue: config.syncInputs ?? false });
  }
  if (config.bindInputOutputPairs !== undefined) {
    providers.push({ provide: FORM_NODE_BIND_INPUT_OUTPUT_PAIRS, useValue: config.bindInputOutputPairs ?? false });
  }
  if (config.validatorMessages !== undefined) {
    providers.push(typeof config.validatorMessages === 'function'
      ? { provide: VALIDATOR_MESSAGES, useFactory: config.validatorMessages }
      : { provide: VALIDATOR_MESSAGES, useValue: config.validatorMessages ?? {} });
  }
  return providers;
};
